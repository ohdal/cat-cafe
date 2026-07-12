import Module from "node:module";

/**
 * `steam-user` eagerly loads `components/cdn_compression.js`, which runs
 * `requireWithFallback('lzma-native', 'lzma')` at import time. Those modules are
 * only used to decompress downloaded Steam **depot/game content** — out of scope
 * for this auth-focused sidecar — but the eager require would otherwise crash the
 * process at startup once bundled (the requires are dynamic and pkg can't trace
 * them, and `lzma-js` in turn reads worker files via `__dirname`).
 *
 * We satisfy the require with a lazy stub: startup succeeds, and if a depot
 * download path is ever exercised it throws a clear, actionable error instead.
 *
 * Must be imported before anything that pulls in `steam-user`.
 */
const message =
  "LZMA is not bundled in steam-sidecar (only Steam auth is in scope; " +
  "depot/content downloads are not supported)";

const lazyStub: unknown = new Proxy(
  function () {
    throw new Error(message);
  },
  {
    get: () => () => {
      throw new Error(message);
    },
  },
);

const STUBBED = new Set(["lzma", "lzma-native"]);

type Loader = { _load: (request: string, ...rest: unknown[]) => unknown };
const mod = Module as unknown as Loader;
const originalLoad = mod._load;
mod._load = function (request: string, ...rest: unknown[]): unknown {
  if (STUBBED.has(request)) return lazyStub;
  return originalLoad.call(this, request, ...rest);
};
