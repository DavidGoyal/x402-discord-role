import { Router } from "express";
import { getStats } from "../controllers/stats.js";

const app = Router();

app.get("/stats", getStats);

export default app;
