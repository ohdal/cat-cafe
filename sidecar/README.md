# steam-sidecar

Node.js sidecar that hosts [`steam-user`](https://github.com/DoctorMcKay/node-steam-user)
for the cat-cafe Tauri app. It exists because `steam-user` opens raw TCP sockets and
uses node crypto, so it **cannot run inside the Tauri webview** — it runs as a separate
process spawned and supervised by the Rust backend.

## Protocol

Newline-delimited JSON over stdin/stdout (see `src/protocol.ts`):

- **Rust → sidecar** (stdin): `{ "id": <n>, "method": <string>, "params": <any> }`
- **sidecar → Rust** (stdout): `{ "id": <n>, "result": <any> }` / `{ "id": <n>, "error": <string> }`
- **events** (stdout): `{ "event": <string>, "data": <any> }` (e.g. `steam.loggedOn`)
- **stderr**: human-readable logs only, never parsed.

## Methods

| method         | params                                  | result            |
| -------------- | --------------------------------------- | ----------------- |
| `ping`         | –                                       | `{ pong, ts }`    |
| `steam.login`  | `{ anonymous }` or `{ accountName, … }` | `{ started }`     |
| `steam.logoff` | –                                       | `{ ok }`          |

## Scripts

```bash
pnpm --filter @cat-cafe/steam-sidecar dev        # run against stdin for manual testing
pnpm --filter @cat-cafe/steam-sidecar typecheck  # tsc --noEmit
pnpm --filter @cat-cafe/steam-sidecar package     # bundle + compile to a triple-named binary
```

`package` writes `src-tauri/binaries/steam-sidecar-<target-triple>` (gitignored), which
Tauri picks up via `externalBin` in `tauri.conf.json`.

### Packaging notes (steam-user + pkg)

Two `steam-user` quirks are handled by the build so the standalone binary actually runs:

- **`system.pem`** — `@doctormckay/steam-crypto` reads it at load via a `__dirname`-relative
  path. `scripts/package-binary.mjs` stages it next to the bundle and it's declared in
  `package.json#pkg.assets`.
- **`lzma` / `lzma-native`** — only used for **depot/content downloads** (not auth). They're
  loaded via a dynamic require that pkg can't trace, so `src/preload.ts` installs a lazy stub:
  startup succeeds and login works; a depot-download path (out of scope) would throw a clear
  error. Add the real modules here if content downloads are ever needed.
