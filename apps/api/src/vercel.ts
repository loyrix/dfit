import type { IncomingMessage, ServerResponse } from "node:http";
import type { InjectOptions, LightMyRequestResponse } from "fastify";
import "./config.js";
import { buildApp } from "./app.js";

const appPromise = buildApp().then(async (app) => {
  await app.ready();
  return app;
});

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const app = await appPromise;
    const injectOptions: InjectOptions = {
      method: normalizeMethod(req.method),
      url: req.url ?? "/",
      headers: req.headers,
      payload: await readPayload(req),
    };
    const response: LightMyRequestResponse = await app.inject(injectOptions);

    writeResponse(res, response);
  } catch (error) {
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ error: "internal_server_error" }));
      return;
    }

    req.destroy(error instanceof Error ? error : new Error("DFit API failed"));
  }
}

type InjectMethod = NonNullable<InjectOptions["method"]>;

const supportedMethods = new Set<InjectMethod>([
  "DELETE",
  "GET",
  "HEAD",
  "OPTIONS",
  "PATCH",
  "POST",
  "PUT",
]);

const normalizeMethod = (method: string | undefined): InjectMethod => {
  const upperMethod = (method ?? "GET").toUpperCase() as InjectMethod;
  return supportedMethods.has(upperMethod) ? upperMethod : "GET";
};

const writeResponse = (res: ServerResponse, response: LightMyRequestResponse): void => {
  res.statusCode = response.statusCode;
  for (const [header, value] of Object.entries(response.headers)) {
    if (value !== undefined) {
      res.setHeader(header, value);
    }
  }
  res.end(response.body);
};

const methodsWithPayload = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const readPayload = async (req: IncomingMessage): Promise<Buffer | undefined> => {
  if (!req.method || !methodsWithPayload.has(req.method)) return undefined;

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return chunks.length === 0 ? undefined : Buffer.concat(chunks);
};
