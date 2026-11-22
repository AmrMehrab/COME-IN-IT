import app from "../server/_core/app";

// Vercel routes /api/* requests through this catch-all Express Function.
// Express receives the original request path (for example /api/trpc/...).
export default app;
