import type { Request, Response } from "express";
import express from "express";
import { exact } from "x402/schemes";
import {
  findMatchingPaymentRequirements,
  processPriceToAtomicAmount,
} from "x402/shared";
import {
  type Network,
  type PaymentPayload,
  type Price,
  type Resource,
  settleResponseHeader,
} from "x402/types";
import { useFacilitator } from "x402/verify";
import { botClient } from "../constants/constants.js";
import { prisma } from "../prisma/prisma.js";
import { createNetworkUser, getBalance } from "../utils/user.js";
import type { Accepts } from "../types.js";
import { v4 as uuidv4 } from "uuid";

const facilitatorUrl = process.env.FACILITATOR_URL as Resource;
const { verify, settle } = useFacilitator({ url: facilitatorUrl });
const x402Version = 1;

/**
 * Creates payment requirements for a given price and network
 *
 * @param price - The price to be paid for the resource
 * @param network - The blockchain network to use for payment
 * @param resource - The resource being accessed
 * @param description - Optional description of the payment
 * @returns An array of payment requirements
 */
function createExactPaymentRequirements(
  price: Price,
  network: Network,
  resource: Resource,
  description = "Get access to the channel",
  payTo: `0x${string}`
): Accepts {
  const atomicAmountForAsset = processPriceToAtomicAmount(price, network);
  if ("error" in atomicAmountForAsset) {
    console.error(atomicAmountForAsset.error);
    throw new Error(atomicAmountForAsset.error);
  }
  const { maxAmountRequired, asset } = atomicAmountForAsset;
  return {
    scheme: "exact",
    network: network as "base",
    maxAmountRequired,
    resource,
    description,
    mimeType: "",
    payTo: payTo,
    maxTimeoutSeconds: 60,
    asset: asset.address,
    outputSchema: {
      input: {
        type: "http",
        method: "GET",
      },
      output: {
        success: {
          type: "boolean",
          description: "Whether the role was successfully assigned",
        },
      },
    },
    extra: {
      name: (
        asset as {
          address: `0x${string}`;
          decimals: number;
          eip712: {
            name: string;
            version: string;
          };
        }
      ).eip712.name,
      version: (
        asset as {
          address: `0x${string}`;
          decimals: number;
          eip712: {
            name: string;
            version: string;
          };
        }
      ).eip712.version,
    },
  };
}

/**
 * Verifies a payment and handles the response
 *
 * @param req - The Express request object
 * @param res - The Express response object
 * @param paymentRequirements - The payment requirements to verify against
 * @returns A promise that resolves to true if payment is valid, false otherwise
 */
async function verifyPayment(
  req: express.Request,
  res: express.Response,
  paymentRequirements: Accepts[]
): Promise<boolean> {
  const payment = req.header("X-PAYMENT");
  if (!payment) {
    console.error("X-PAYMENT header is required");
    res.status(402).json({
      x402Version,
      error: "X-PAYMENT header is required",
      accepts: paymentRequirements,
    });
    return false;
  }

  let decodedPayment: PaymentPayload;
  try {
    decodedPayment = exact.evm.decodePayment(payment);
    decodedPayment.x402Version = x402Version;
  } catch (error) {
    console.error(error);
    res.status(402).json({
      x402Version,
      error: error || "Invalid or malformed payment header",
      accepts: paymentRequirements,
    });
    return false;
  }

  try {
    const selectedPaymentRequirement =
      findMatchingPaymentRequirements(paymentRequirements, decodedPayment) ||
      paymentRequirements[0];
    const response = await verify(decodedPayment, selectedPaymentRequirement!);

    if (!response.isValid) {
      console.error(response.invalidReason);
      res.status(402).json({
        x402Version,
        error: response.invalidReason,
        accepts: paymentRequirements,
        payer: response.payer,
      });
      return false;
    }
  } catch (error) {
    console.error(error);
    res.status(402).json({
      x402Version,
      error,
      accepts: paymentRequirements,
    });
    return false;
  }

  return true;
}

export const getAccess = async (req: Request, res: Response) => {
  try {
    const {
      discordId,
      networkId,
      serverId,
      roleId,
      roleApplicableTime,
      token,
    } = req.body;
    if (
      !discordId ||
      !networkId ||
      !serverId ||
      !roleId ||
      !roleApplicableTime
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Discord ID, network ID, server ID, role ID and role applicable time are required",
      });
    }

    const botToken = process.env.DISCORD_TOKEN;
    if (!botToken) {
      return res
        .status(400)
        .json({ success: false, error: "Discord token is required" });
    }

    if (!botClient.isReady()) {
      await botClient.login(botToken);
    }

    const [server, network, user] = await Promise.all([
      prisma.server.findUnique({
        where: { id: serverId },
        include: {
          roles: {
            where: {
              id: roleId,
            },
          },
        },
      }),
      prisma.network.findUnique({
        where: { id: networkId },
      }),
      prisma.user.findUnique({
        where: { discordId },
        include: {
          networkUsers: {
            where: { networkId },
          },
        },
      }),
    ]);

    if (!server || server.roles.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Server or role not found" });
    }

    if (!network) {
      return res
        .status(404)
        .json({ success: false, error: "Network not found" });
    }

    if (!user || user.networkUsers.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Insufficient Balance" });
    }

    if (server.expiresOn < new Date()) {
      return res
        .status(400)
        .json({ success: false, error: "Server subscription has expired" });
    }

    if (server.numberOfTxns <= 0) {
      return res.status(400).json({
        success: false,
        error: "Server subscription has reached the maximum number of txns",
      });
    }

    if (
      server.roles[0]?.roleApplicableTime &&
      !server.roles[0]?.roleApplicableTime?.includes(roleApplicableTime)
    ) {
      return res
        .status(400)
        .json({ success: false, error: "Role applicable time is not valid" });
    }

    const totalCost =
      (Number(server.roles[0]?.costInUsdc) * roleApplicableTime) / 86400;

    if (token) {
      const invoice = await prisma.invoice.findUnique({
        where: {
          token,
          expiresOn: { gt: new Date() },
        },
      });
      if (!invoice) {
        return res
          .status(400)
          .json({ success: false, error: "Invoice not found" });
      }
      if (
        invoice.roleApplicableTime !== roleApplicableTime ||
        invoice.roleId !== roleId ||
        invoice.userId !== user.id ||
        invoice.serverId !== server.id
      ) {
        return res.status(400).json({
          success: false,
          error: "Invoice is not valid",
        });
      }
    } else {
      const balance = await getBalance(
        network,
        user.networkUsers[0]?.publicKey ?? ""
      );

      if (balance < totalCost) {
        return res
          .status(400)
          .json({ success: false, error: "Insufficient Balance" });
      }
    }
    const userId = user.discordId;

    const [member, role] = await Promise.all([
      botClient.guilds.cache.get(server.serverDiscordId)?.members.fetch(userId),
      botClient.guilds.cache
        .get(server.serverDiscordId)
        ?.roles.fetch(server.roles[0]?.roleDiscordId!),
    ]);

    if (!member) {
      return res
        .status(400)
        .json({ success: false, error: "Member not found" });
    }

    if (!role) {
      return res.status(400).json({ success: false, error: "Role not found" });
    }

    if (network.name === "solana") {
      return res.status(200).json({ success: true, access: true });
    } else {
      const resource =
        `${req.protocol}://${req.headers.host}${req.originalUrl}` as Resource;
      const priceInUsdc = Number(totalCost) / 1000000;
      console.log(`Price in USDC: ${priceInUsdc}`);
      const paymentRequirements = [
        createExactPaymentRequirements(
          priceInUsdc.toString(),
          network.name as Network,
          resource,
          `Get access to role`,
          server.receiverEthereumAddress as `0x${string}`
        ),
      ];
      res.setHeader("content-type", "application/json");

      const isValid = await verifyPayment(req, res, paymentRequirements);
      if (!isValid) {
        console.error("Payment verification failed");
        res.status(402).json({
          x402Version,
          error: "Payment verification failed",
          accepts: paymentRequirements,
        });
        return;
      }

      try {
        const decodedPayment = exact.evm.decodePayment(
          req.header("X-PAYMENT")!
        );

        // Find the matching payment requirement
        const selectedPaymentRequirement =
          findMatchingPaymentRequirements(
            paymentRequirements,
            decodedPayment
          ) || paymentRequirements[0];

        const settleResponse = await settle(
          decodedPayment,
          selectedPaymentRequirement!
        );

        if (!settleResponse.success) {
          console.log("Failed to settle payment");
          res.status(402).json({
            x402Version,
            error: settleResponse.errorReason || "Failed to settle payment",
            accepts: paymentRequirements,
            payer: settleResponse.payer,
          });
          return;
        }
        const responseHeader = settleResponseHeader(settleResponse);
        res.setHeader("X-PAYMENT-RESPONSE", responseHeader);
        res.setHeader("x-payment-response", responseHeader);

        await member.roles.add(role);

        await prisma.roleAssigned.create({
          data: {
            userId,
            username: user.discordUsername,
            serverId: server.id,
            roleId: roleId!,
            expiresOn: new Date(Date.now() + roleApplicableTime * 1000),
            amount: totalCost,
            txnLink: settleResponse.transaction,
          },
        });

        if (token) {
          const invoice = await prisma.invoice.findUnique({
            where: {
              token,
              expiresOn: { gt: new Date() },
            },
          });
          if (invoice) {
            await prisma.invoice.delete({
              where: { id: invoice.id },
            });
          }
        }

        res.status(200).json({ success: true });
        return;
      } catch (error) {
        console.error(error);
        res.status(402).json({
          x402Version,
          error,
          accepts: paymentRequirements,
        });
        return;
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal server error" });
    return;
  }
};

export const createInvoice = async (req: Request, res: Response) => {
  try {
    const { discordId, serverId, roleId, roleApplicableTime } = req.body;
    if (!discordId || !serverId || !roleId || !roleApplicableTime) {
      return res.status(400).json({
        success: false,
        error:
          "Discord ID, network ID, server ID, role ID and role applicable time are required",
      });
    }

    const token = process.env.DISCORD_TOKEN;
    if (!token) {
      return res
        .status(400)
        .json({ success: false, error: "Discord token is required" });
    }

    if (!botClient.isReady()) {
      await botClient.login(token);
    }

    const [server, network] = await Promise.all([
      prisma.server.findUnique({
        where: { id: serverId },
        include: {
          roles: {
            where: {
              id: roleId,
            },
          },
        },
      }),
      prisma.network.findFirst({
        where: { name: "base-sepolia" },
      }),
    ]);

    if (!server || server.roles.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Server or role not found" });
    }

    if (!network) {
      return res
        .status(404)
        .json({ success: false, error: "Network not found" });
    }

    if (server.expiresOn < new Date()) {
      return res
        .status(400)
        .json({ success: false, error: "Server subscription has expired" });
    }

    if (server.numberOfTxns <= 0) {
      return res.status(400).json({
        success: false,
        error: "Server subscription has reached the maximum number of txns",
      });
    }

    let user = await prisma.user.findUnique({
      where: { discordId },
      include: {
        networkUsers: {
          where: { networkId: network.id },
        },
      },
    });
    if (!user) {
      const discordUser = await botClient.users.fetch(discordId);
      if (!discordUser) {
        return res.status(404).json({
          success: false,
          error: "Discord user not found",
        });
      }

      const newUser = await prisma.user.create({
        data: {
          discordId,
          discordUsername: discordUser.username,
        },
      });

      await createNetworkUser(network.id, newUser.id, network);
      user = await prisma.user.findUnique({
        where: { discordId },
        include: {
          networkUsers: {
            where: { networkId: network.id },
          },
        },
      });
    } else if (user.networkUsers.length === 0) {
      await createNetworkUser(network.id, user.id, network);

      user = await prisma.user.findUnique({
        where: { discordId },
        include: {
          networkUsers: {
            where: { networkId: network.id },
          },
        },
      });
    }

    if (
      server.roles[0]?.roleApplicableTime &&
      !server.roles[0]?.roleApplicableTime?.includes(roleApplicableTime)
    ) {
      return res
        .status(400)
        .json({ success: false, error: "Role applicable time is not valid" });
    }

    const userId = user!.id;

    const [member, role] = await Promise.all([
      botClient.guilds.cache
        .get(server.serverDiscordId)
        ?.members.fetch(discordId),
      botClient.guilds.cache
        .get(server.serverDiscordId)
        ?.roles.fetch(server.roles[0]?.roleDiscordId!),
    ]);

    if (!member) {
      return res
        .status(400)
        .json({ success: false, error: "Member not found" });
    }

    if (!role) {
      return res.status(400).json({ success: false, error: "Role not found" });
    }

    const invoice = await prisma.invoice.upsert({
      where: {
        userId_serverId_roleId: {
          serverId: server.id,
          roleId: roleId!,
          userId,
        },
      },
      update: {
        token: uuidv4(),
        roleApplicableTime,
        expiresOn: new Date(Date.now() + 60 * 1000),
      },
      create: {
        userId,
        serverId: server.id,
        roleId: roleId!,
        roleApplicableTime,
        token: uuidv4(),
        expiresOn: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    res.status(200).json({ success: true, token: invoice.token });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal server error" });
    return;
  }
};

export const getInvoice = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res
        .status(400)
        .json({ success: false, error: "Token is required" });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { token: token as string, expiresOn: { gt: new Date() } },
    });

    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, error: "Invoice not found" });
    }

    const server = await prisma.server.findUnique({
      where: { id: invoice.serverId },
      select: {
        serverDiscordId: true,
      },
    });
    if (!server) {
      return res
        .status(404)
        .json({ success: false, error: "Server not found" });
    }

    res.status(200).json({
      success: true,
      invoice: {
        ...invoice,
        serverDiscordId: server.serverDiscordId,
      },
    });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal server error" });
    return;
  }
};
