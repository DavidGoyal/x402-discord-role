import React from "react";
import { prisma } from "../../../../prisma/prisma";
import { notFound } from "next/navigation";
import HomeClient from "./components/home-client";

export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { token, expiresAt: { gt: new Date() } },
  });

  if (!invoice) {
    return notFound();
  }

  const [user, server] = await Promise.all([
    prisma.user.findUnique({
      where: { id: invoice?.userId },
    }),
    prisma.server.findUnique({
      where: { serverId: invoice?.serverId },
      include: {
        channels: {
          where: {
            roleId: invoice?.roleId,
          },
        },
      },
    }),
  ]);

  if (!user || !server) {
    console.error("User or server not found");
    return notFound();
  }

  return <HomeClient invoice={invoice} user={user} server={server} />;
}
