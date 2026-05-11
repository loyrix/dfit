import type { IncomingMessage, ServerResponse } from "node:http";
import "./config.js";
import { buildApp } from "./app.js";

const appPromise = buildApp().then(async (app) => {
  await app.ready();
  return app;
});

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const app = await appPromise;
    app.server.emit("request", req, res);
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
