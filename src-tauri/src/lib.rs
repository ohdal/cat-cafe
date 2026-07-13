mod sidecar;

use serde_json::Value;
use sidecar::SidecarState;
use tauri::{LogicalPosition, LogicalSize, Manager, State, WebviewWindow};

/// Height of the bottom app bar, in logical (CSS) pixels.
const BAR_HEIGHT: f64 = 500.0;

/// Resize the window into a full-width, fixed-height bar pinned to the bottom of
/// the monitor, then reveal it. Width and position depend on the monitor, so this
/// runs at runtime rather than being hard-coded in tauri.conf.json.
fn position_bottom_bar(win: &WebviewWindow) -> tauri::Result<()> {
    if let Some(monitor) = win.current_monitor()?.or(win.primary_monitor()?) {
        let scale = monitor.scale_factor();
        let origin = monitor.position().to_logical::<f64>(scale);
        let size = monitor.size().to_logical::<f64>(scale);
        win.set_size(LogicalSize::new(size.width, BAR_HEIGHT))?;
        win.set_position(LogicalPosition::new(
            origin.x,
            origin.y + size.height - BAR_HEIGHT,
        ))?;
    }
    win.show()?;
    Ok(())
}

/// Toggle whether the (transparent) window passes mouse events through to whatever
/// is behind it. Enable this over transparent zones so the desktop stays clickable;
/// disable it over the actual app UI so it can be interacted with.
#[tauri::command]
fn set_click_through(window: WebviewWindow, ignore: bool) -> Result<(), String> {
    window
        .set_ignore_cursor_events(ignore)
        .map_err(|e| e.to_string())
}

/// Generic escape hatch: forward any `{ method, params }` to the sidecar.
/// Prefer the typed commands below from the frontend; this is handy for debugging.
#[tauri::command]
async fn sidecar_invoke(
    app: tauri::AppHandle,
    state: State<'_, SidecarState>,
    method: String,
    params: Option<Value>,
) -> Result<Value, String> {
    state
        .request(&app, &method, params.unwrap_or(Value::Null))
        .await
}

/// Round-trip health check against the sidecar.
#[tauri::command]
async fn sidecar_ping(
    app: tauri::AppHandle,
    state: State<'_, SidecarState>,
) -> Result<Value, String> {
    state.request(&app, "ping", Value::Null).await
}

/// Start a Steam login. The resulting session arrives asynchronously via the
/// `steam://steam.loggedOn` event.
#[tauri::command]
async fn steam_login(
    app: tauri::AppHandle,
    state: State<'_, SidecarState>,
    params: Option<Value>,
) -> Result<Value, String> {
    state
        .request(&app, "steam.login", params.unwrap_or(Value::Null))
        .await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .manage(SidecarState::default())
        .setup(|app| {
            // Don't hard-crash if the sidecar binary is missing (e.g. before the
            // first `pnpm sidecar:package`); surface it and let commands report it.
            if let Err(e) = app.state::<SidecarState>().spawn(app.handle()) {
                eprintln!("[sidecar] failed to start: {e}");
            }
            if let Some(win) = app.get_webview_window("main") {
                if let Err(e) = position_bottom_bar(&win) {
                    eprintln!("[window] failed to position bottom bar: {e}");
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            sidecar_invoke,
            sidecar_ping,
            steam_login,
            set_click_through
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
