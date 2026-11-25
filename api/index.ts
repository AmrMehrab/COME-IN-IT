import express from "express";
import cookieParser from "cookie-parser";
import { registerOAuthRoutes } from "../server/_core/oauth";
const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
registerOAuthRoutes(app);
export default app;
