import SteamUser from "steam-user";
import { emit, log } from "./protocol.js";

export interface LoginParams {
  /** Log in anonymously (no credentials). Useful for smoke-testing the pipe. */
  anonymous?: boolean;
  accountName?: string;
  password?: string;
  /** Steam Guard code, if required. */
  twoFactorCode?: string;
  refreshToken?: string;
}

/**
 * Thin wrapper around `steam-user`. It cannot run in the Tauri webview (it opens
 * raw TCP sockets and uses node crypto), which is the whole reason this sidecar
 * exists. All lifecycle events are forwarded to the host as protocol events
 * prefixed `steam.*`.
 */
export class SteamBridge {
  private client = new SteamUser();

  constructor() {
    this.client.on("loggedOn", () => {
      emit("steam.loggedOn", {
        steamID: this.client.steamID?.getSteamID64() ?? null,
      });
    });
    this.client.on("error", (err: Error) => {
      emit("steam.error", { message: err?.message ?? String(err) });
    });
    this.client.on("disconnected", (eresult: number, msg?: string) => {
      emit("steam.disconnected", { eresult, msg: msg ?? null });
    });
    this.client.on("steamGuard", (domain: string | null) => {
      emit("steam.steamGuard", { domain });
    });
  }

  /** Kick off a login. Resolution of the actual session arrives via `steam.loggedOn`. */
  login(params: LoginParams = {}): { started: boolean } {
    log("steam.login", params.anonymous ? "(anonymous)" : params.accountName);
    if (params.anonymous || !params.accountName) {
      this.client.logOn({ anonymous: true });
    } else {
      this.client.logOn({
        accountName: params.accountName,
        password: params.password,
        twoFactorCode: params.twoFactorCode,
        refreshToken: params.refreshToken,
      });
    }
    return { started: true };
  }

  logoff(): { ok: true } {
    this.client.logOff();
    return { ok: true };
  }
}
