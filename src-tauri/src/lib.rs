mod sidecar;

use serde_json::Value;
use sidecar::SidecarState;
use tauri::{Manager, State};

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
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            sidecar_invoke,
            sidecar_ping,
            steam_login
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
