import React from "react";
import { notFound } from "next/navigation";
import HomeClient from "./components/home-client";
import axios from "axios";
import { Invoice, Server, User } from "@/types/discord";

async function getInvoice(token: string): Promise<Invoice | null> {
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_DISCORD_APP_URL}/api/user/invoice?token=${token}`
    );
    return response.data.invoice;
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function getUser(userId: string): Promise<User | null> {
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_DISCORD_APP_URL}/api/user/id/${userId}`
    );
    return response.data.user;
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function getServer(serverId: string): Promise<Server | null> {
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_DISCORD_APP_URL}/api/server/${serverId}`
    );
    return response.data.server;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invoice = await getInvoice(token);

  if (!invoice) {
    return notFound();
  }

  const [user, server] = await Promise.all([
    getUser(invoice?.userId),
    getServer(invoice?.serverId),
  ]);

  if (!user || !server) {
    console.error("User or server not found");
    return notFound();
  }

  return <HomeClient invoice={invoice} user={user} server={server} />;
}
