import { PrismaClient } from "@prisma/client";
import { Client, GatewayIntentBits } from "discord.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});
const prisma = new PrismaClient();

async function main() {
  try {
    if (!client.isReady()) {
      await client.login(process.env.DISCORD_TOKEN);
    }

    const roleAssignedUsers = await prisma.roleAssigned.findMany({
      where: {
        expiryTime: {
          lt: new Date(),
        },
        active: true,
      },
    });

    for (const roleAssignedUser of roleAssignedUsers) {
      const member = await client.guilds.cache
        .get(roleAssignedUser.serverId)
        ?.members.fetch(roleAssignedUser.userId);

      if (!member) {
        continue;
      }

      const role = await client.guilds.cache
        .get(roleAssignedUser.serverId)
        ?.roles.fetch(roleAssignedUser.roleId);
      if (!role) {
        continue;
      }

      await member.roles.remove(role);

      await prisma.roleAssigned.update({
        where: {
          id: roleAssignedUser.id,
        },
        data: {
          active: false,
        },
      });
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

setInterval(main, 60000);
