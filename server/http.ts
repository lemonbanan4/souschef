import type { IncomingMessage, ServerResponse } from "node:http";

/** Generic HTTP helpers shared by the kitchen API and the RevenueCat webhook. */

export function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(body));
}

export function readBody(req: IncomingMessage, maxBytes = 200_000): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk: Buffer) => {
      data += chunk.toString();
      if (data.length > maxBytes) {
        // Without destroying the socket, "data" events keep firing after
        // reject() and this string grows unbounded — an easy memory-DoS.
        req.destroy();
        reject(new Error("body too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error("invalid json"));
      }
    });
    req.on("error", reject);
  });
}
