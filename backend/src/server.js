import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { connectDatabase } from "./config/database.js";
import { requireAuth } from "./middleware/requireAuth.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();

const port = Number(process.env.PORT || 4000);
const mongoUri = process.env.MONGODB_URI;
const allowedOrigins = String(process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
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

app.use((error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: error.message || "Unexpected server error.",
  });
});

async function start() {
  await connectDatabase(mongoUri);

  app.listen(port, () => {
    const originSummary = allowedOrigins.length ? allowedOrigins.join(", ") : "any origin";
    console.log(`Allowed client origins: ${originSummary}`);
    console.log(`Backend listening on http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});
