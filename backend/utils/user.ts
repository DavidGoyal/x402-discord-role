import type { Network } from "@prisma/client";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { prisma } from "../prisma/prisma.js";
import { ethers } from "ethers";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import jwt from "jsonwebtoken";

export const createNetworkUser = async (
  networkId: string,
  userId: string,
  network: Network
) => {
  if (network.name === "solana") {
    const keypair = Keypair.generate();

    return await prisma.networkUser.create({
      data: {
        networkId,
        userId,
        publicKey: keypair.publicKey.toBase58(),
        privateKey: jwt.sign(
          { privateKey: keypair.secretKey.toString() },
          process.env.JWT_SECRET!
        ),
      },
    });
  } else {
    const keypair = ethers.Wallet.createRandom();
    return await prisma.networkUser.create({
      data: {
        networkId,
        userId,
        publicKey: keypair.address,
        privateKey: jwt.sign(
          { privateKey: keypair.privateKey },
          process.env.JWT_SECRET!
        ),
      },
    });
  }
};

export const getBalance = async (network: Network, publicKey: string) => {
  try {
    if (network.name === "solana") {
      const connection = new Connection(network.rpcUrl);
      const getTokenAccount = await getAssociatedTokenAddress(
        new PublicKey(network.usdcAddress),
        new PublicKey(publicKey),
        false
      );
      const balance = await connection.getTokenAccountBalance(getTokenAccount);
      return balance.value.amount;
    } else {
      const provider = new ethers.JsonRpcProvider(network.rpcUrl);
      const usdcContract = new ethers.Contract(
        network.usdcAddress,
        ["function balanceOf(address owner) view returns (uint256)" as const],
        provider
      );
      const balance = await usdcContract.balanceOf!(publicKey);
      return balance.toString();
    }
  } catch (error) {
    console.error(error);
    return 0;
  }
};
