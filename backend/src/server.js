import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { connectDatabase } from "./config/database.js";
import { requireAuth } from "./middleware/requireAuth.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();

const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 4000);
const mongoUri = process.env.MONGODB_URI;
const configuredOrigins = String(process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = Array.from(new Set([...configuredOrigins, "http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"]));

const isLocalDevelopmentOrigin = (origin) => {
  if (!origin) return true;
  const normalized = origin.replace(/\/$/, "");
  return /^(https?:\/\/)(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalized);
};

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || isLocalDevelopmentOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked request from origin ${origin}. Add it to CLIENT_ORIGIN.`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/analytics", requireAuth, analyticsRoutes);
app.use("/api/ai", requireAuth, aiRoutes);

app.use((error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: error.message || "Unexpected server error.",
  });
});

async function start() {
  await connectDatabase(mongoUri);

  const availablePort = await new Promise((resolve, reject) => {
    const tryPort = (candidatePort) => {
      const server = app.listen(candidatePort, host, () => {
        resolve(candidatePort);
        server.removeListener("error", onError);
      });

      const onError = (error) => {
        server.removeListener("error", onError);
        if (error.code === "EADDRINUSE") {
          if (candidatePort >= port + 20) {
            reject(new Error(`Port ${port} is unavailable and no fallback port was found.`));
            return;
          }

          tryPort(candidatePort + 1);
          return;
        }

        reject(error);
      };

      server.once("error", onError);
    };

    tryPort(port);
  }).catch((error) => {
    console.error("Failed to start backend:", error);
    process.exit(1);
    return null;
  });

  if (availablePort === null) {
    return;
  }

  const originSummary = allowedOrigins.length ? allowedOrigins.join(", ") : "any origin";
  console.log(`Allowed client origins: ${originSummary}`);
  console.log(`Backend listening on http://${host}:${availablePort}`);
}

start();
