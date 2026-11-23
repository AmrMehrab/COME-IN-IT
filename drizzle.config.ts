import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

const databaseUrl = new URL(connectionString);
const isLocalDatabase = ["localhost", "127.0.0.1", "::1"].includes(databaseUrl.hostname);

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    host: databaseUrl.hostname,
    port: Number(databaseUrl.port || 3306),
    user: decodeURIComponent(databaseUrl.username),
    password: decodeURIComponent(databaseUrl.password),
    database: decodeURIComponent(databaseUrl.pathname.replace(/^\//, "")),
    ...(isLocalDatabase
      ? {}
      : {
          ssl: {
            minVersion: "TLSv1.2",
            rejectUnauthorized: true,
          },
        }),
  },
});
