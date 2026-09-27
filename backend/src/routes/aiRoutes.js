import express from "express";
import { runAiOrchestration } from "../ai/orchestratorAgent.js";

const router = express.Router();
const MAX_MESSAGE_LENGTH = 1200;

router.post("/chat", async (req, res, next) => {
  try {
    const message = String(req.body?.message || "").trim().replace(/\s+/g, " ");
    const history = Array.isArray(req.body?.history) ? req.body.history : [];
    if (!message) return res.status(400).json({ success: false, message: "A question is required." });
    if (message.length > MAX_MESSAGE_LENGTH) return res.status(400).json({ success: false, message: `Questions must be ${MAX_MESSAGE_LENGTH} characters or fewer.` });
    const result = await runAiOrchestration({ userId: req.auth.userId, message, history });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

export default router;
