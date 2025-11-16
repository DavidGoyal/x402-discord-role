import { Router } from "express";
import { getUserByDiscordId, getUserById } from "../controllers/user.js";
import { authenticate } from "../middleware.js";

const app = Router();

app.get("/user/:discordId", authenticate, getUserByDiscordId);
app.get("/user/id/:userId", getUserById);

export default app;
