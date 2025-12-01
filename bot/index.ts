import axios, { AxiosError } from "axios";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  MessageFlags,
  StringSelectMenuBuilder,
  TextChannel,
} from "discord.js";
import { withPaymentInterceptor } from "x402-axios";
import { createSigner } from "x402-fetch";
import jwt from "jsonwebtoken";

// Configuration
const DISCORD_TOKEN = process.env.DISCORD_TOKEN || "YOUR_BOT_TOKEN_HERE";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// Types for backend responses
interface RoleConfig {
  id: string;
  costInUsdc: string;
  roleDiscordId: string;
  roleName: string;
  roleApplicableTime: number[];
}

interface ServerConfig {
  id: string;
  serverDiscordId: string;
  defaultChannelId: string;
  receiverSolanaAddress: string;
  receiverEthereumAddress: string;
  roleCount: number;
  roles: Array<{
    id: string;
    costInUsdc: bigint;
    roleDiscordId: string;
    roleName: string;
    roleApplicableTime: number;
  }>;
}

interface NetworkUser {
  networkId: string;
  networkName: string;
  publicKey: string;
  balance: string;
  privateKey: string;
}

// Initialize Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

async function fetchUserInfo(discordId: string): Promise<{
  networkUsers: NetworkUser[];
} | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/user/${discordId}`, {
      headers: {
        Authorization: `Bearer ${process.env.BACKEND_API_KEY}`,
      },
    });
    if (!response.ok) {
      console.log(`User ${discordId} not found in backend`);
      return { networkUsers: [] };
    }
    const data = (await response.json()) as {
      success: boolean;
      networkUsers: NetworkUser[];
    };
    return data.success
      ? { networkUsers: data.networkUsers }
      : { networkUsers: [] };
  } catch (error) {
    console.error("Error fetching user info:", error);
    return { networkUsers: [] };
  }
}
// Helper function to fetch role configuration from backend
async function fetchRoleConfig(roleId: string): Promise<RoleConfig | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/role/${roleId}`, {
      headers: {
        Authorization: `Bearer ${process.env.BACKEND_API_KEY}`,
      },
    });

    if (!response.ok) {
      console.log(`Role ${roleId} not configured in backend`);
      return null;
    }

    const data = (await response.json()) as {
      success: boolean;
      role: RoleConfig;
    };
    return data.success ? data.role : null;
  } catch (error) {
    console.error("Error fetching role config:", error);
    return null;
  }
}

// Helper function to fetch server configuration from backend
async function fetchServerConfig(
  serverId: string
): Promise<ServerConfig | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/server/${serverId}`, {
      headers: {
        Authorization: `Bearer ${process.env.BACKEND_API_KEY}`,
      },
    });

    if (!response.ok) {
      console.log(`Server ${serverId} not configured in backend`);
      return null;
    }

    const data = (await response.json()) as {
      success: boolean;
      server: ServerConfig;
    };
    return data.success ? data.server : null;
  } catch (error) {
    console.error("Error fetching server config:", error);
    return null;
  }
}

// Handle duration selection and show payment options
async function handleDurationSelected(
  interaction: any,
  roleId: string,
  roleName: string,
  roleConfig: RoleConfig,
  selectedDuration: number,
  userId: string,
  username: string
) {
  const durationInDays = selectedDuration / (24 * 60 * 60);
  const roleCost = Number(roleConfig.costInUsdc);

  // Create payment method buttons
  const discordWalletButton = new ButtonBuilder()
    .setCustomId(`pay_with_discord_wallet_${roleId}_${selectedDuration}`)
    .setLabel("Pay with Discord Wallet")
    .setEmoji("💵")
    .setStyle(ButtonStyle.Success);

  const invoiceButton = new ButtonBuilder()
    .setCustomId(`pay_with_invoice_${roleId}_${selectedDuration}`)
    .setLabel("Pay with Invoice")
    .setEmoji("💰")
    .setStyle(ButtonStyle.Primary);

  const buttonsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    discordWalletButton,
    invoiceButton
  );

  const embed = new EmbedBuilder()
    .setTitle("💳 Select Payment Method")
    .setDescription(
      `You are purchasing **${roleName}** role for **${durationInDays.toFixed(
        2
      )} days**.\n\n` +
        `💰 **Cost:** ${(roleCost * durationInDays) / 1000000} USDC\n\n` +
        `Please select your preferred payment method:`
    )
    .setColor(0x5865f2)
    .addFields(
      {
        name: "💵 Discord Wallet",
        value: "Pay using your Discord wallet balance (instant)",
        inline: false,
      },
      {
        name: "💰 Invoice",
        value: "Generate an invoice to pay externally",
        inline: false,
      }
    )
    .setTimestamp();

  // Check if interaction has been deferred or replied to
  if (interaction.deferred || interaction.replied) {
    await interaction.editReply({
      embeds: [embed],
      components: [buttonsRow],
    });
  } else {
    await interaction.reply({
      embeds: [embed],
      components: [buttonsRow],
      flags: MessageFlags.Ephemeral,
    });
  }

  console.log(
    `⏱️ ${username} (${userId}) selected ${durationInDays} days for ${roleName} role`
  );
}

// Handle Discord wallet payment
async function handleDiscordWalletPayment(
  interaction: any,
  roleId: string,
  selectedDuration: number,
  userId: string,
  username: string,
  userInfo: { networkUsers: NetworkUser[] } | null,
  serverConfig: ServerConfig | null
) {
  if (!userInfo || !serverConfig) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle("❌ Error")
          .setDescription("Failed to retrieve user or server information.")
          .setColor(0xed4245),
      ],
    });
    return;
  }

  // Fetch role config
  const roleConfig = await fetchRoleConfig(roleId);
  if (!roleConfig) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle("❌ Error")
          .setDescription("Role configuration not found.")
          .setColor(0xed4245),
      ],
    });
    return;
  }

  const roleCost = Number(roleConfig.costInUsdc);
  const baseNetworkUser = userInfo.networkUsers.find(
    (user) => user.networkName === "base-sepolia"
  );

  if (!baseNetworkUser) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle("❌ Error")
          .setDescription("Not enough balance to purchase this role.")
          .setColor(0xed4245),
      ],
    });
    return;
  }

  const userBalance = baseNetworkUser?.balance;

  if (userBalance && Number(userBalance) < roleCost) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle("❌ Insufficient Balance")
          .setDescription(
            `You do not have enough balance to purchase this role.\n\n` +
              `**Your Balance:** ${Number(userBalance) / 1000000} USDC\n` +
              `**Required:** ${roleCost / 1000000} USDC`
          )
          .setColor(0xed4245),
      ],
    });
    return;
  }
  const decodedPrivateKey = jwt.verify(
    baseNetworkUser?.privateKey ?? "",
    process.env.JWT_SECRET!
  ) as { privateKey: string };

  const signer = await createSigner(
    "base-sepolia",
    decodedPrivateKey?.privateKey ?? ""
  );

  try {
    const api = withPaymentInterceptor(
      axios.create({
        baseURL: BACKEND_URL,
      }),
      signer
    );
    const response = await api.post(
      `/api/user/access`,
      {
        discordId: userId,
        networkId: baseNetworkUser?.networkId,
        serverId: serverConfig.id,
        roleId: roleConfig.id,
        roleApplicableTime: selectedDuration,
      },
      {
        headers: {
          AUTHORIZATION: `Bearer ${process.env.BACKEND_API_KEY}`,
        },
      }
    );

    if (!response.data.success) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle("❌ Payment Failed")
            .setDescription("Failed to process your payment. Please try again.")
            .setColor(0xed4245),
        ],
      });
      return;
    }

    const durationInDays = selectedDuration / (24 * 60 * 60);

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle("✅ Payment Successful!")
          .setDescription(
            `Congratulations! You have successfully purchased the **${roleConfig.roleName}** role!\n\n` +
              `**Duration:** ${durationInDays.toFixed(2)} days\n` +
              `**Cost:** ${(roleCost * durationInDays) / 1000000} USDC\n` +
              `**Payment Method:** Discord Wallet`
          )
          .setColor(0x57f287)
          .setTimestamp(),
      ],
    });

    console.log(
      `💵 ${username} (${userId}) paid with Discord Wallet for ${
        roleConfig.roleName
      } role (${durationInDays.toFixed(2)} days)`
    );
  } catch (error) {
    console.error(
      error instanceof AxiosError
        ? (error as AxiosError).response?.data
        : "Unknown error"
    );
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle("❌ Payment Error")
          .setDescription("An error occurred while processing your payment.")
          .setColor(0xed4245),
      ],
    });
  }
}

// Handle invoice payment
async function handleInvoicePayment(
  interaction: any,
  roleId: string,
  selectedDuration: number,
  userId: string,
  serverConfig: ServerConfig | null
) {
  if (!serverConfig) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle("❌ Error")
          .setDescription("Server configuration not found.")
          .setColor(0xed4245),
      ],
    });
    return;
  }

  // Fetch role config
  const roleConfig = await fetchRoleConfig(roleId);
  if (!roleConfig) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle("❌ Error")
          .setDescription("Role configuration not found.")
          .setColor(0xed4245),
      ],
    });
    return;
  }

  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/user/invoice`,
      {
        discordId: userId,
        serverId: serverConfig.id,
        roleId: roleConfig.id,
        roleApplicableTime: selectedDuration,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.BACKEND_API_KEY}`,
        },
      }
    );

    if (!response.data.success) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle("❌ Error")
            .setDescription("Failed to create invoice.")
            .setColor(0xed4245),
        ],
      });
      return;
    }
    const token = response.data.token;

    const durationInDays = selectedDuration / (24 * 60 * 60);

    // Create invoice embed with payment addresses
    const invoiceEmbed = new EmbedBuilder()
      .setTitle(`💰 Payment Invoice for ${roleConfig.roleName} role`)
      .setDescription(
        `**Role:** ${roleConfig.roleName}\n` +
          `**Duration:** ${durationInDays.toFixed(2)} days\n` +
          `**Please visit the following link to pay:** ${FRONTEND_URL}/invoice/discord/${token}\n` +
          `**Please pay within 5 minutes of generating the invoice**`
      )
      .setColor(0xfee75c)
      .setTimestamp();

    await interaction.editReply({
      embeds: [invoiceEmbed],
    });
  } catch (error) {
    console.error(error);
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle("❌ Error")
          .setDescription("Failed to create invoice.")
          .setColor(0xed4245),
      ],
    });
    return;
  }
}

// Create interactive panel with buttons and dropdown showing ALL available roles
async function createInteractivePanel(
  channel: TextChannel,
  serverConfig: ServerConfig
) {
  // Delete all messages in the channel (Discord allows bulk delete for messages < 14 days old)
  try {
    let deleted;
    do {
      deleted = await channel.bulkDelete(100, true); // true = filter out messages > 14 days
    } while (deleted.size > 0);
  } catch (error) {
    console.error("Error deleting messages:", error);
  }
  if (serverConfig.roles.length === 0) {
    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("❌ No Roles Configured")
          .setDescription(
            "No roles have been configured yet. Please contact an administrator."
          )
          .setColor(0xed4245),
      ],
    });
    return;
  }

  // Build dropdown options from all configured roles
  const roleOptions = [];
  let embedDescription = "**Available Roles:**\n\n";

  for (const roleConfig of serverConfig.roles) {
    const costInUsdc = Number(roleConfig.costInUsdc);

    // Handle roleApplicableTime as array or single number
    let durationDisplay = "";
    const timeOptions = roleConfig.roleApplicableTime;

    if (Array.isArray(timeOptions)) {
      if (timeOptions.length === 1) {
        const durationInDays = timeOptions[0] / (24 * 60 * 60);
        durationDisplay = `${durationInDays.toFixed(2)} days`;
      } else {
        // Multiple duration options
        const durations = timeOptions.map((time) => time / (24 * 60 * 60));
        durationDisplay = `${Math.min(...durations).toFixed(2)}-${Math.max(
          ...durations
        ).toFixed(2)} days (multiple options)`;
      }
    } else {
      const durationInDays = timeOptions / (24 * 60 * 60);
      durationDisplay = `${durationInDays.toFixed(2)} days`;
    }

    // Add to dropdown options
    roleOptions.push({
      label: roleConfig.roleName,
      description: `${costInUsdc / 1000000} USDC for ${durationDisplay}`,
      value: `${roleConfig.roleDiscordId}`,
      emoji: "🎭",
    });

    // Add to embed description
    embedDescription += `🎭 **${roleConfig.roleName}**\n`;
    embedDescription += `   💰 Cost: ${costInUsdc / 1000000} USDC\n`;
    embedDescription += `   ⏱️ Duration: ${durationDisplay}\n\n`;
  }

  if (roleOptions.length === 0) {
    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("❌ No Valid Roles")
          .setDescription(
            "No valid roles found. Please check role configurations."
          )
          .setColor(0xed4245),
      ],
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle("💰 Role Shop")
    .setDescription(
      embedDescription +
        "\n*Select a role from the dropdown below to purchase!*"
    )
    .setColor(0x5865f2)
    .addFields(
      { name: "💵 Deposit", value: "Add funds to your account", inline: true },
      {
        name: "💸 Withdraw",
        value: "Withdraw funds from your account",
        inline: true,
      }
    )
    .setFooter({ text: "All interactions are private and visible only to you" })
    .setTimestamp();

  // Create buttons row
  const depositButton = new ButtonBuilder()
    .setCustomId("deposit")
    .setLabel("Deposit")
    .setEmoji("💵")
    .setStyle(ButtonStyle.Success);

  const withdrawButton = new ButtonBuilder()
    .setCustomId("withdraw")
    .setLabel("Withdraw")
    .setEmoji("💸")
    .setStyle(ButtonStyle.Danger);

  const getRoleButton = new ButtonBuilder()
    .setCustomId("get_role_none")
    .setLabel("Get Role")
    .setEmoji("🎭")
    .setStyle(ButtonStyle.Primary)
    .setDisabled(true); // Disabled by default until a role is selected

  const buttonsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    depositButton,
    withdrawButton,
    getRoleButton
  );

  // Create dropdown menu with ALL configured roles
  const roleSelect = new StringSelectMenuBuilder()
    .setCustomId(`role_select_${serverConfig.serverDiscordId}`)
    .setPlaceholder("🛒 Select a role to purchase")
    .addOptions(roleOptions);

  const selectRow =
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(roleSelect);

  // Send the message with components
  await channel.send({
    embeds: [embed],
    components: [buttonsRow, selectRow],
  });

  console.log(
    `📋 Panel created in channel ${channel.name} with ${roleOptions.length} role(s)`
  );
}

// Helper function to fetch all servers from backend
async function fetchAllServers(): Promise<ServerConfig[]> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/servers`, {
      headers: {
        Authorization: `Bearer ${process.env.BACKEND_API_KEY}`,
      },
    });

    if (!response.ok) {
      console.log(await response.json());
      console.log("Failed to fetch servers from backend");
      return [];
    }

    const data = (await response.json()) as {
      success: boolean;
      servers: ServerConfig[];
    };
    return data.success ? data.servers : [];
  } catch (error) {
    console.error("Error fetching all servers:", error);
    return [];
  }
}

// Send panel to default channel for a server
async function sendPanelToDefaultChannel(server: ServerConfig) {
  try {
    // Find the guild (Discord server)
    const guild = client.guilds.cache.get(server.serverDiscordId);

    if (!guild) {
      console.log(`⚠️  Bot is not in server ${server.serverDiscordId}`);
      return;
    }

    // Get the default channel
    const channel = await guild.channels.fetch(server.defaultChannelId);

    if (!channel || !channel.isTextBased()) {
      console.log(
        `⚠️  Default channel ${server.defaultChannelId} not found or not a text channel`
      );
      return;
    }

    // Send the panel
    await createInteractivePanel(channel as TextChannel, server);
    console.log(`✅ Panel sent to default channel in ${guild.name}`);
  } catch (error) {
    console.error(
      `❌ Error sending panel to server ${server.serverDiscordId}:`,
      error
    );
  }
}

// Bot ready event
client.once("clientReady", async () => {
  console.log(`✅ Bot logged in as ${client.user?.tag}`);
  console.log(`Bot is ready to serve in ${client.guilds.cache.size} guilds`);

  // Fetch all configured servers from backend
  console.log("\n🔄 Fetching server configurations...");
  const servers = await fetchAllServers();

  if (servers.length === 0) {
    console.log("⚠️  No servers configured in backend");
    console.log("💡 Use the backend API to configure servers and roles");
    return;
  }

  console.log(`📋 Found ${servers.length} configured server(s)\n`);

  // Send panel to each server's default channel
  for (const server of servers) {
    await sendPanelToDefaultChannel(server);
    // Add a small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log("\n🎉 Bot is fully initialized and panels have been sent!");
});

// Handle bot joining a new server
client.on("guildCreate", async (guild) => {
  console.log(`\n🆕 Bot joined new server: ${guild.name} (${guild.id})`);

  // Fetch server configuration
  const serverConfig = await fetchServerConfig(guild.id);

  if (!serverConfig) {
    console.log(`⚠️  Server ${guild.id} not configured in backend`);
    console.log("💡 Configure this server using the backend API:");
    console.log(`   POST ${BACKEND_URL}/api/server`);
    console.log(
      `   Body: { "serverId": "${guild.id}", "defaultChannelId": "...", "receiverSolanaAddress": "...", "receiverEthereumAddress": "..." }`
    );
    return;
  }

  // Send panel to default channel
  console.log(`✅ Server is configured, sending panel to default channel...`);
  await sendPanelToDefaultChannel(serverConfig);
});

// Handle button and dropdown interactions
client.on("interactionCreate", async (interaction) => {
  const userId = interaction.user.id;
  const username = interaction.user.username;
  const guildId = interaction.guildId;

  // Handle button clicks
  if (interaction.isButton()) {
    // Defer the reply IMMEDIATELY for all buttons to prevent timeout
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // Now fetch server and user config (can take time)
    const userInfo = await fetchUserInfo(userId);
    const serverConfig = await fetchServerConfig(guildId!);
    if (!serverConfig) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle("❌ Server Not Configured")
            .setDescription(
              "This server is not configured for deposits. Please contact an administrator."
            )
            .setColor(0xed4245),
        ],
      });
      return;
    }

    if (!userInfo) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle("❌ User Not Found")
            .setDescription("User not found in backend")
            .setColor(0xed4245),
        ],
      });
      return;
    }

    if (interaction.customId === "deposit") {
      const fields = [];
      for (const networkUser of userInfo.networkUsers) {
        fields.push({
          name: networkUser.networkName.toUpperCase() + " ADDRESS",
          value: `\`\`\`${networkUser.publicKey}\`\`\``,
          inline: false,
        });
        fields.push({
          name: networkUser.networkName.toUpperCase() + " BALANCE",
          value: `**${Number(networkUser.balance) / 1000000} USDC**`,
          inline: false,
        });
      }
      fields.push(
        {
          name: "📋 Instructions",
          value:
            "1. Send USDC to either address above (choose your preferred network)\n2. Wait for blockchain confirmation (1-5 minutes)\n3. Your balance will be updated automatically.",
        },
        {
          name: "⚠️ Important",
          value:
            "• Only send USDC tokens to these addresses\n• Make sure you're on the correct network.",
        }
      );
      // Create deposit embed
      const depositEmbed = new EmbedBuilder()
        .setTitle("💵 Deposit Funds")
        .setDescription(
          "Send USDC to one of the addresses below to add funds to your account."
        )
        .setColor(0x57f287)
        .addFields(fields)
        .setTimestamp();

      // Reply with ephemeral message (only visible to the user)
      await interaction.editReply({
        embeds: [depositEmbed],
      });

      console.log(
        `💵 ${username} (${userId}) clicked Deposit button for server ${interaction.guildId}`
      );
    } else if (interaction.customId === "withdraw") {
      // Create withdraw embed
      const withdrawEmbed = new EmbedBuilder()
        .setTitle("💸 Withdraw Funds")
        .setDescription(
          "You have selected the withdraw option.\n\nCurrent Balance: **500 USDC**"
        )
        .setColor(0xed4245)
        .addFields(
          {
            name: "Available Balance",
            value: "500 USDC",
            inline: true,
          },
          {
            name: "Minimum Amount",
            value: "100 USDC",
            inline: true,
          },
          {
            name: "💳 Withdrawal Address",
            value:
              "Please provide your withdrawal address in the support channel",
          },
          {
            name: "⏱️ Processing Time",
            value: "Withdrawals are processed within 24-48 hours",
          },
          {
            name: "⚠️ Important",
            value:
              "Make sure to double-check your withdrawal address. Transactions cannot be reversed!",
          }
        )
        .setTimestamp();

      // Reply with ephemeral message
      await interaction.editReply({
        embeds: [withdrawEmbed],
      });

      console.log(`💸 ${username} (${userId}) clicked Withdraw button`);
    } else if (interaction.customId.startsWith("get_role_")) {
      // Handle role purchase from the main Get Role button
      const roleData = interaction.customId.replace("get_role_", "");

      if (roleData === "none") {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ No Role Selected")
              .setDescription(
                "Please select a role from the dropdown menu first."
              )
              .setColor(0xed4245),
          ],
        });
        return;
      }

      const roleId = roleData;

      if (!roleId) {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Error")
              .setDescription("Invalid role data. Please select a role again.")
              .setColor(0xed4245),
          ],
        });
        return;
      }

      // Fetch role config to get role details
      const roleConfig = await fetchRoleConfig(roleId);

      if (!interaction.guildId) {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Error")
              .setDescription("Could not determine server.")
              .setColor(0xed4245),
          ],
        });
        return;
      }

      if (!roleConfig) {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Error")
              .setDescription("Could not process role assignment.")
              .setColor(0xed4245),
          ],
        });
        return;
      }

      // Check if there are multiple time options
      const timeOptions = roleConfig.roleApplicableTime;

      if (typeof timeOptions === "number") {
        // Single time option - convert to array for consistent handling
        await handleDurationSelected(
          interaction,
          roleId,
          roleConfig.roleName,
          roleConfig,
          timeOptions,
          userId,
          username
        );
      } else if (Array.isArray(timeOptions) && timeOptions.length > 1) {
        // Multiple time options - show selection menu
        const durationOptions = timeOptions.map((time) => {
          const days = time / (24 * 60 * 60);
          return {
            label: `${days.toFixed(2)} Days`,
            description: `Get role for ${days.toFixed(2)} days`,
            value: `duration_${roleId}_${time}`,
            emoji: "⏱️",
          };
        });

        const durationSelect = new StringSelectMenuBuilder()
          .setCustomId(`duration_select_${roleId}`)
          .setPlaceholder("📅 Select duration")
          .addOptions(durationOptions);

        const selectRow =
          new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
            durationSelect
          );

        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle("⏱️ Select Duration")
              .setDescription(
                `How many days do you want to purchase the **${roleConfig.roleName}** role for?`
              )
              .setColor(0x5865f2),
          ],
          components: [selectRow],
        });
      } else if (Array.isArray(timeOptions) && timeOptions.length === 1) {
        // Single time option in array
        const firstTime = timeOptions[0];
        if (firstTime !== undefined) {
          await handleDurationSelected(
            interaction,
            roleId,
            roleConfig.roleName,
            roleConfig,
            firstTime,
            userId,
            username
          );
        } else {
          await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setTitle("❌ Error")
                .setDescription("Invalid time option.")
                .setColor(0xed4245),
            ],
          });
        }
      } else {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Error")
              .setDescription("No duration options available for this role.")
              .setColor(0xed4245),
          ],
        });
      }
    } else if (interaction.customId.startsWith("pay_with_discord_wallet_")) {
      // Handle payment with Discord wallet
      const paymentData = interaction.customId.replace(
        "pay_with_discord_wallet_",
        ""
      );
      const [roleId, duration] = paymentData.split("_");

      if (!roleId || !duration) {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Error")
              .setDescription("Invalid payment data.")
              .setColor(0xed4245),
          ],
        });
        return;
      }

      await handleDiscordWalletPayment(
        interaction,
        roleId,
        parseInt(duration),
        userId,
        username,
        userInfo,
        serverConfig
      );
    } else if (interaction.customId.startsWith("pay_with_invoice_")) {
      // Handle payment with invoice
      const paymentData = interaction.customId.replace("pay_with_invoice_", "");
      const [roleId, duration] = paymentData.split("_");

      if (!roleId || !duration) {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Error")
              .setDescription("Invalid payment data.")
              .setColor(0xed4245),
          ],
        });
        return;
      }

      await handleInvoicePayment(
        interaction,
        roleId,
        parseInt(duration),
        userId,
        serverConfig
      );
    }
  }

  // Handle dropdown selection
  if (interaction.isStringSelectMenu()) {
    // Defer reply IMMEDIATELY for all dropdowns to prevent timeout
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // Now fetch server and user config (can take time)
    const userInfo = await fetchUserInfo(userId);
    const serverConfig = await fetchServerConfig(guildId!);

    if (!serverConfig) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle("❌ Server Not Configured")
            .setDescription(
              "This server is not configured for deposits. Please contact an administrator."
            )
            .setColor(0xed4245),
        ],
      });
      return;
    }

    if (!userInfo) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle("❌ User Not Found")
            .setDescription("User not found in backend")
            .setColor(0xed4245),
        ],
      });
      return;
    }

    if (interaction.customId.startsWith("duration_select_")) {
      // Handle duration selection
      const selectedValue = interaction.values[0];

      if (!selectedValue || !selectedValue.startsWith("duration_")) {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Error")
              .setDescription("Invalid duration selection.")
              .setColor(0xed4245),
          ],
        });
        return;
      }

      // Parse: "duration_roleId_time"
      const parts = selectedValue.split("_");
      if (parts.length !== 3) {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Error")
              .setDescription("Invalid duration format.")
              .setColor(0xed4245),
          ],
        });
        return;
      }

      const [, roleId, timeStr] = parts;

      if (!roleId || !timeStr) {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Error")
              .setDescription("Missing duration parameters.")
              .setColor(0xed4245),
          ],
        });
        return;
      }

      const selectedDuration = parseInt(timeStr);

      // Fetch role config
      const roleConfig = await fetchRoleConfig(roleId);

      if (!roleConfig) {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Error")
              .setDescription("Role configuration not found.")
              .setColor(0xed4245),
          ],
        });
        return;
      }

      const guildId = interaction.guildId;
      if (!guildId) {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Error")
              .setDescription("Could not determine server.")
              .setColor(0xed4245),
          ],
        });
        return;
      }

      // Show payment options
      await handleDurationSelected(
        interaction,
        roleId,
        roleConfig.roleName,
        roleConfig,
        selectedDuration,
        userId,
        username
      );
    } else if (interaction.customId.startsWith("role_select_")) {
      const selectedValue = interaction.values[0];

      if (!selectedValue) {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Error")
              .setDescription("No role selected.")
              .setColor(0xed4245),
          ],
        });
        return;
      }

      // Parse the selected value: "roleId"
      const selectedRoleId = selectedValue;

      if (!selectedRoleId) {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Error")
              .setDescription("Invalid role selection.")
              .setColor(0xed4245),
          ],
        });
        return;
      }

      // Fetch role configuration from backend
      const roleConfig = await fetchRoleConfig(selectedRoleId);

      if (!roleConfig) {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Error")
              .setDescription("Role configuration not found.")
              .setColor(0xed4245),
          ],
        });
        return;
      }

      const guildId = interaction.guildId;

      if (!guildId) {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Error")
              .setDescription("Could not determine server.")
              .setColor(0xed4245),
          ],
        });
        return;
      }

      // Calculate cost and duration for display
      const roleCost = Number(roleConfig.costInUsdc);
      const timeOptions = roleConfig.roleApplicableTime;

      let durationDisplay = "";
      if (Array.isArray(timeOptions)) {
        if (timeOptions.length === 1 && timeOptions[0] !== undefined) {
          const durationInDays = timeOptions[0] / (24 * 60 * 60);
          durationDisplay = `${durationInDays.toFixed(2)} days`;
        } else if (timeOptions.length > 1) {
          const durations = timeOptions.map((time) => time / (24 * 60 * 60));
          durationDisplay = `${Math.min(...durations).toFixed(2)}-${Math.max(
            ...durations
          ).toFixed(2)} days`;
        }
      } else {
        const durationInDays = timeOptions / (24 * 60 * 60);
        durationDisplay = `${durationInDays.toFixed(2)} days`;
      }

      // Create a "Get Role" button for this specific user's ephemeral message
      const getRoleButton = new ButtonBuilder()
        .setCustomId(`get_role_${selectedRoleId}`)
        .setLabel(`Get ${roleConfig.roleName}`)
        .setEmoji("🎭")
        .setStyle(ButtonStyle.Primary);

      const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        getRoleButton
      );

      // Send an ephemeral message (only visible to the user who selected the role)
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle("✅ Role Selected")
            .setDescription(
              `You have selected the **${roleConfig.roleName}** role!\n\n` +
                `💰 **Cost:** ${roleCost / 1000000} USDC per day\n` +
                `⏱️ **Duration:** ${durationDisplay}\n\n` +
                `Click the button below to proceed with the purchase.`
            )
            .setColor(0x57f287)
            .setTimestamp(),
        ],
        components: [buttonRow],
      });

      console.log(
        `🎭 ${username} (${userId}) selected ${roleConfig.roleName} role from dropdown`
      );
    }
  }
});

// Command to send the interactive panel
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.author.id !== message.guild?.ownerId) return;

  if (message.content === "!panel") {
    // Command to send the interactive panel (can be restricted to admins)
    const channel = message.channel as TextChannel;

    if (!message.guildId) {
      await message.reply("This command can only be used in a server!");
      return;
    }

    const serverConfig = await fetchServerConfig(message.guildId);
    if (!serverConfig) {
      await message.reply(
        "This server is not configured for role management. Please contact an administrator."
      );
      return;
    }

    await createInteractivePanel(channel, serverConfig);

    // Optionally delete the command message
    try {
      await message.delete();
    } catch (error) {
      console.log("Could not delete message (missing permissions)");
    }
  }
});

// Error handling
client.on("error", (error) => {
  console.error("Discord client error:", error);
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});

// Login to Discord
client.login(DISCORD_TOKEN);
