import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import accessRoutes from "./routes/access.js";
import serverRoutes from "./routes/server.js";
import statsRoutes from "./routes/stats.js";
import userRoutes from "./routes/user.js";

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.use("/api/user", accessRoutes);
app.use("/api", userRoutes);
app.use("/api", serverRoutes);
app.use("/api", statsRoutes);

export default app;
