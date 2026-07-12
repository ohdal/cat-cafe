//! Supervises the Node `steam-sidecar` process and bridges its newline-delimited
//! JSON protocol to Tauri commands (request/response) and events.
//!
//! See `sidecar/src/protocol.ts` for the wire format.

use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Mutex as StdMutex;
use std::time::Duration;

use serde_json::{json, Value};
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_shell::process::{CommandChild, CommandEvent};
use tauri_plugin_shell::ShellExt;
use tokio::sync::oneshot;

const REQUEST_TIMEOUT: Duration = Duration::from_secs(30);

/// Managed Tauri state. Holds the child's stdin handle and the table of
/// in-flight requests awaiting a response.
#[derive(Default)]
pub struct SidecarState {
    // `CommandChild::write` is synchronous, so a std mutex is sufficient and never
    // held across an await.
    child: StdMutex<Option<CommandChild>>,
    pending: StdMutex<HashMap<u64, oneshot::Sender<Result<Value, String>>>>,
    next_id: AtomicU64,
}

impl SidecarState {
    /// Spawn the sidecar and start pumping its stdout. Idempotent-ish: call once at setup.
    pub fn spawn(&self, app: &AppHandle) -> Result<(), String> {
        let (mut rx, child) = app
            .shell()
            .sidecar("binaries/steam-sidecar")
            .map_err(|e| format!("configure sidecar: {e}"))?
            .spawn()
            .map_err(|e| format!("spawn sidecar: {e}"))?;

        *self.child.lock().unwrap() = Some(child);

        let app = app.clone();
        // The reader task owns nothing that lives in `self`; it reaches pending
        // requests through the managed state on the AppHandle.
        tauri::async_runtime::spawn(async move {
            let mut buf: Vec<u8> = Vec::new();
            while let Some(event) = rx.recv().await {
                match event {
                    CommandEvent::Stdout(chunk) => {
                        buf.extend_from_slice(&chunk);
                        while let Some(nl) = buf.iter().position(|b| *b == b'\n') {
                            let line: Vec<u8> = buf.drain(..=nl).collect();
                            handle_line(&app, &line[..line.len() - 1]);
                        }
                    }
                    CommandEvent::Stderr(chunk) => {
                        eprint!("{}", String::from_utf8_lossy(&chunk));
                    }
                    CommandEvent::Terminated(payload) => {
                        let _ = app.emit("sidecar://terminated", json!({ "code": payload.code }));
                        break;
                    }
                    _ => {}
                }
            }
        });

        Ok(())
    }

    /// Send a request and await its correlated response.
    pub async fn request(
        &self,
        app: &AppHandle,
        method: &str,
        params: Value,
    ) -> Result<Value, String> {
        let id = self.next_id.fetch_add(1, Ordering::Relaxed);
        let (tx, rx) = oneshot::channel();
        self.pending.lock().unwrap().insert(id, tx);

        let mut line = serde_json::to_vec(&json!({
            "id": id, "method": method, "params": params,
        }))
        .map_err(|e| e.to_string())?;
        line.push(b'\n');

        {
            let mut guard = self.child.lock().unwrap();
            let child = guard.as_mut().ok_or("sidecar not running")?;
            child.write(&line).map_err(|e| format!("write: {e}"))?;
        }

        match tokio::time::timeout(REQUEST_TIMEOUT, rx).await {
            Ok(Ok(result)) => result,
            Ok(Err(_)) => Err("sidecar dropped the response channel".into()),
            Err(_) => {
                self.pending.lock().unwrap().remove(&id);
                let _ = app; // reserved for future cancellation signalling
                Err(format!("sidecar request '{method}' timed out"))
            }
        }
    }
}

/// Parse one stdout line and route it: responses resolve a pending request,
/// events are re-emitted to the frontend as `steam://<event>`.
fn handle_line(app: &AppHandle, line: &[u8]) {
    if line.is_empty() {
        return;
    }
    let Ok(value) = serde_json::from_slice::<Value>(line) else {
        eprintln!("[sidecar] unparseable line: {}", String::from_utf8_lossy(line));
        return;
    };

    if let Some(id) = value.get("id").and_then(Value::as_u64) {
        let state = app.state::<SidecarState>();
        if let Some(tx) = state.pending.lock().unwrap().remove(&id) {
            let outcome = if let Some(err) = value.get("error") {
                Err(err.as_str().unwrap_or("sidecar error").to_string())
            } else {
                Ok(value.get("result").cloned().unwrap_or(Value::Null))
            };
            let _ = tx.send(outcome);
        }
        return;
    }

    if let Some(event) = value.get("event").and_then(Value::as_str) {
        let data = value.get("data").cloned().unwrap_or(Value::Null);
        let _ = app.emit(&format!("steam://{event}"), data);
    }
}
