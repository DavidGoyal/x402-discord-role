import { Router } from "express";
import {
  getAllServers,
  getMyServerByServerId,
  getMyServerRevenueStats,
  getMyServerSubscription,
  getMyServers,
  getRoleById,
  getServerById,
} from "../controllers/server.js";
import { authenticate } from "../middleware.js";

const router = Router();

// GET routes
router.get("/servers", authenticate, getAllServers);
router.get(
  "/server/my-server/:serverDiscordId/revenue",
  getMyServerRevenueStats
);
router.get(
  "/server/my-server/:serverDiscordId/subscription",
  getMyServerSubscription
);
router.get("/server/my-server/:serverDiscordId", getMyServerByServerId);
router.get("/server/my-servers", getMyServers);
router.get("/server/:serverDiscordId", getServerById);
router.get("/role/:roleDiscordId", authenticate, getRoleById);

export default router;
