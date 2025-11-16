import type { Request, Response } from "express";
import { prisma } from "../prisma/prisma.js";

export const getStats = async (req: Request, res: Response) => {
  try {
    const [users, servers, channels] = await Promise.all([
      prisma.user.count(),
      prisma.server.count(),
      prisma.channel.count(),
    ]);

    res
      .status(200)
      .json({ success: true, stats: { users, servers, channels } });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal server error" });
    return;
  }
};
