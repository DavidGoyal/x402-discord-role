import { Router } from "express";
import { getStats } from "../controllers/stats";

const app = Router();

app.get("/stats", getStats);

export default app;
