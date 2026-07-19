//! Click-through control for the fullscreen transparent overlay window.
//!
//! The window covers the whole work area so panels (cafe bar, inventory) can sit
//! above one another, but most of that area must stay click-through to the
//! desktop. A single window can't be click-through in part of its area and
//! opaque-to-clicks in another part at the OS level, so instead we poll the
//! global cursor position and flip `set_ignore_cursor_events` for the whole
//! window based on whether the cursor is currently over a registered
//! "interactive rect" (reported by the frontend via `set_interactive_rects`).

use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Manager, WebviewWindow};

type Rect = (f64, f64, f64, f64); // x, y, w, h — logical, window-local (CSS px)

#[derive(Default)]
pub struct InteractiveRects(Mutex<Vec<Rect>>);

/// Reported by the frontend whenever an interactive region (the cafe bar, an
/// open panel, ...) mounts, unmounts, or resizes. Rects are in CSS px relative
/// to the window's own content area (i.e. plain `getBoundingClientRect()`).
#[tauri::command]
pub fn set_interactive_rects(state: tauri::State<InteractiveRects>, rects: Vec<[f64; 4]>) {
    *state.0.lock().unwrap() = rects.into_iter().map(|r| (r[0], r[1], r[2], r[3])).collect();
}

fn point_in_rects(x: f64, y: f64, rects: &[Rect]) -> bool {
    rects
        .iter()
        .any(|&(rx, ry, rw, rh)| x >= rx && x <= rx + rw && y >= ry && y <= ry + rh)
}

/// Poll the global cursor position ~25x/sec and toggle click-through so only
/// registered interactive rects capture the mouse; everywhere else passes
/// clicks through to whatever is behind the (transparent) window.
pub fn start_click_through_loop(app: AppHandle, window: WebviewWindow) {
    tauri::async_runtime::spawn(async move {
        let mut ignoring = true; // window starts fully click-through
        let mut interval = tokio::time::interval(Duration::from_millis(40));
        loop {
            interval.tick().await;

            let (Ok(cursor), Ok(pos), Ok(scale)) = (
                app.cursor_position(),
                window.inner_position(),
                window.scale_factor(),
            ) else {
                continue;
            };

            let local_x = (cursor.x - pos.x as f64) / scale;
            let local_y = (cursor.y - pos.y as f64) / scale;

            let rects = app.state::<InteractiveRects>().0.lock().unwrap().clone();
            let want_ignore = !point_in_rects(local_x, local_y, &rects);

            if want_ignore != ignoring {
                if window.set_ignore_cursor_events(want_ignore).is_ok() {
                    ignoring = want_ignore;
                }
            }
        }
    });
}
