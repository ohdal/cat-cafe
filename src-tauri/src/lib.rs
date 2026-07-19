mod overlay;
mod sidecar;

use overlay::{set_interactive_rects, start_click_through_loop, InteractiveRects};
use serde_json::Value;
use sidecar::SidecarState;
use tauri::{LogicalPosition, LogicalSize, Manager, State, WebviewWindow};

/// Size the window to fully cover the monitor's work area (fullscreen transparent
/// overlay), then reveal it. The cafe bar (bottom band) and the inventory/modals
/// above it are positioned within this window via CSS.
///
/// work_area excludes OS chrome (on macOS, the Dock and menu bar), so the overlay
/// doesn't fight the Dock.
fn position_overlay(win: &WebviewWindow) -> tauri::Result<()> {
    if let Some(monitor) = win.current_monitor()?.or(win.primary_monitor()?) {
        let scale = monitor.scale_factor();
        let area = monitor.work_area();
        let origin = area.position.to_logical::<f64>(scale);
        let size = area.size.to_logical::<f64>(scale);
        win.set_size(LogicalSize::new(size.width, size.height))?;
        win.set_position(LogicalPosition::new(origin.x, origin.y))?;
    }
    win.show()?;
    Ok(())
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
        .manage(InteractiveRects::default())
        .setup(|app| {
            // Don't hard-crash if the sidecar binary is missing (e.g. before the
            // first `pnpm sidecar:package`); surface it and let commands report it.
            if let Err(e) = app.state::<SidecarState>().spawn(app.handle()) {
                eprintln!("[sidecar] failed to start: {e}");
            }
            if let Some(win) = app.get_webview_window("main") {
                if let Err(e) = position_overlay(&win) {
                    eprintln!("[window] failed to size overlay: {e}");
                }
                start_click_through_loop(app.handle().clone(), win);
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            sidecar_invoke,
            sidecar_ping,
            steam_login,
            set_interactive_rects
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
