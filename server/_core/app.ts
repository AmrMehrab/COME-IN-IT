import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerGoogleOAuthRoutes } from "./googleOAuth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { DiditWebhookError, handleDiditWebhook } from "../didit";

const app = express();

// Keep the existing API middleware and route contracts in one reusable app.
// The same Express instance is used by the local Node server and Vercel Function.
app.use(express.json({ limit: "50mb" }));

app.post("/api/webhooks/didit", async (req, res) => {
  try {
    const result = await handleDiditWebhook(
      req.body,
      req.get("X-Signature-V2"),
      req.get("X-Timestamp")
    );
    if (result === "not_found")
      return res.status(404).json({ error: "unknown_session" });
    return res.status(200).json({ received: true, result });
  } catch (error) {
    if (error instanceof DiditWebhookError) {
      return res.status(error.statusCode).json({ error: error.publicCode });
    }
    console.error("[Didit webhook] Processing failed");
    return res.status(500).json({ error: "webhook_processing_failed" });
  }
});

app.use(express.urlencoded({ limit: "50mb", extended: true }));
registerStorageProxy(app);
registerGoogleOAuthRoutes(app);

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

export default app;
