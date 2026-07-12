import "./preload.js"; // must come first: stubs optional native deps before steam-user loads
import { createInterface } from "node:readline";
import { emit, log, respond, type Request } from "./protocol.js";
import { SteamBridge, type LoginParams } from "./steam.js";

const steam = new SteamBridge();

/** Route a request to its handler. Handlers may be sync or async. */
async function dispatch(method: string, params: unknown): Promise<unknown> {
  switch (method) {
    case "ping":
      return { pong: true, ts: Date.now() };
    case "steam.login":
      return steam.login((params as LoginParams) ?? {});
    case "steam.logoff":
      return steam.logoff();
    default:
      throw new Error(`unknown method: ${method}`);
  }
}

const rl = createInterface({ input: process.stdin });

rl.on("line", async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  let req: Request;
  try {
    req = JSON.parse(trimmed) as Request;
  } catch {
    log("dropped non-JSON line");
    return;
  }

  try {
    const result = await dispatch(req.method, req.params);
    respond({ id: req.id, result });
  } catch (err) {
    respond({ id: req.id, error: err instanceof Error ? err.message : String(err) });
  }
});

// If stdin closes, the host is gone — shut down cleanly.
rl.on("close", () => {
  log("stdin closed, exiting");
  process.exit(0);
});

log(`steam-sidecar up (node ${process.version})`);
emit("ready");
