/**
 * Frontend access to the Steam sidecar.
 *
 * The webview never talks to `steam-user` directly (it can't). It calls Rust
 * commands, which relay to the Node sidecar over a JSON-line pipe. Sidecar
 * lifecycle events arrive as Tauri events named `steam://<event>`.
 */
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

export interface LoginParams {
  anonymous?: boolean;
  accountName?: string;
  password?: string;
  twoFactorCode?: string;
  refreshToken?: string;
}

/** Health-check the sidecar pipe. Resolves with `{ pong, ts }`. */
export function ping(): Promise<{ pong: boolean; ts: number }> {
  return invoke("sidecar_ping");
}

/** Begin a Steam login. Watch `onLoggedOn` / `onError` for the outcome. */
export function login(params: LoginParams = {}): Promise<{ started: boolean }> {
  return invoke("steam_login", { params });
}

/** Escape hatch to call any sidecar method directly. */
export function invokeSidecar<T = unknown>(
  method: string,
  params?: unknown,
): Promise<T> {
  return invoke("sidecar_invoke", { method, params: params ?? null });
}

export interface LoggedOnEvent {
  steamID: string | null;
}
export interface SteamErrorEvent {
  message: string;
}

export const onLoggedOn = (cb: (e: LoggedOnEvent) => void): Promise<UnlistenFn> =>
  listen<LoggedOnEvent>("steam://steam.loggedOn", (e) => cb(e.payload));

export const onError = (cb: (e: SteamErrorEvent) => void): Promise<UnlistenFn> =>
  listen<SteamErrorEvent>("steam://steam.error", (e) => cb(e.payload));

export const onDisconnected = (cb: () => void): Promise<UnlistenFn> =>
  listen("steam://steam.disconnected", () => cb());
