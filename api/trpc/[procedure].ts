import app from "../../dist/api.js";

// Explicit tRPC procedure route. Vercel's top-level catch-all serves other
// API endpoints; this route ensures nested /api/trpc/<procedure> URLs are
// dispatched to the same bundled Express application.
export default app;
