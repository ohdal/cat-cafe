/**
 * Newline-delimited JSON protocol between the Rust host and this Node sidecar.
 *
 * Rust -> sidecar (over stdin), one JSON object per line:
 *   { "id": <number>, "method": <string>, "params": <any> }
 *
 * sidecar -> Rust (over stdout), one JSON object per line, two shapes:
 *   response: { "id": <number>, "result": <any> } | { "id": <number>, "error": <string> }
 *   event:    { "event": <string>, "data": <any> }
 *
 * stderr is reserved for human-readable logging and is never parsed as protocol.
 */

export interface Request {
  id: number;
  method: string;
  params?: unknown;
}

export type Response =
  | { id: number; result: unknown }
  | { id: number; error: string };

export interface Event {
  event: string;
  data?: unknown;
}

/** Emit an out-of-band event to the host. */
export function emit(event: string, data?: unknown): void {
  process.stdout.write(JSON.stringify({ event, data } satisfies Event) + "\n");
}

/** Emit a response to a specific request id. */
export function respond(res: Response): void {
  process.stdout.write(JSON.stringify(res) + "\n");
}

/** Structured log line (goes to stderr so it never collides with the protocol). */
export function log(...args: unknown[]): void {
  process.stderr.write(`[sidecar] ${args.map(String).join(" ")}\n`);
}
