/**
 * Minimal ambient types for `steam-user` (the package ships no declarations).
 * Only the surface this sidecar actually uses is declared; extend as needed.
 */
declare module "steam-user" {
  interface LogOnDetailsAnonymous {
    anonymous: true;
  }
  interface LogOnDetailsUser {
    accountName?: string;
    password?: string;
    twoFactorCode?: string;
    refreshToken?: string;
  }
  type LogOnDetails = LogOnDetailsAnonymous | LogOnDetailsUser;

  interface SteamID {
    getSteamID64(): string;
  }

  export default class SteamUser {
    steamID: SteamID | null;
    logOn(details?: LogOnDetails): void;
    logOff(): void;
    on(event: "loggedOn", listener: () => void): this;
    on(event: "error", listener: (err: Error) => void): this;
    on(event: "disconnected", listener: (eresult: number, msg?: string) => void): this;
    on(event: "steamGuard", listener: (domain: string | null) => void): this;
    on(event: string, listener: (...args: unknown[]) => void): this;
  }
}
