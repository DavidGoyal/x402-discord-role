import type { Request, Response } from "express";
import { prisma } from "../prisma/prisma.js";
import { createNetworkUser, getBalance } from "../utils/user.js";

export const getUserByDiscordId = async (req: Request, res: Response) => {
  try {
    const { discordId } = req.params;
    if (!discordId) {
      return res.status(400).json({
        success: false,
        error: "Discord ID is required",
      });
    }

    let [networks, user] = await Promise.all([
      prisma.network.findMany(),
      prisma.user.findUnique({
        where: { discordId },
      }),
    ]);

    if (!user) {
      user = await prisma.user.create({
        data: { discordId },
      });
    }

    const networkUsers: {
      networkId: string;
      networkName: string;
      publicKey: string;
      balance: string;
      privateKey: string;
    }[] = [];

    for (const network of networks) {
      let networkUser = await prisma.networkUser.findUnique({
        where: {
          networkId_userId: { userId: user.id, networkId: network.id },
        },
      });
      if (!networkUser) {
        networkUser = await createNetworkUser(network.id, user.id, network);
      }

      const balance = await getBalance(network, networkUser.publicKey);
      networkUsers.push({
        networkId: network.id,
        networkName: network.name,
        publicKey: networkUser.publicKey,
        balance,
        privateKey: networkUser.privateKey,
      });
    }

    res.status(200).json({ success: true, networkUsers });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal server error" });
    return;
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, error: "User ID is required" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.status(200).json({ success: true, user });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal server error" });
    return;
  }
};
