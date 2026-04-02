import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import feedbackRoutes from "./routes/FeedbackRoutes";
import authRoutes from "./routes/AuthRoutes";

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(express.json());

app.use("/api/feedback", feedbackRoutes);
app.use("/api/auth", authRoutes);

app.get("/health", (req, res) => {
  res.json({ success: true, message: "FeedPulse API is running" });
});

export default app;
