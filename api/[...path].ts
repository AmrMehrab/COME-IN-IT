import app from "../server/_core/app.ts";

// Vercel routes /api/* requests through this catch-all Express Function.
// Keep the TypeScript extension explicit so the Vercel Node builder resolves
// and bundles the local Express application instead of leaving an unresolved
// extensionless ESM import in the deployed Function.
export default app;
