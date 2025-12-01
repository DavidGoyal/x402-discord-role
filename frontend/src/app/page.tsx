import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import axios from "axios";
import { Activity, ArrowRight, Shield, Users } from "lucide-react";
import Link from "next/link";
import { FaDiscord, FaTelegram } from "react-icons/fa6";

async function getDiscordStats(): Promise<{
  users: number;
  servers: number;
  roles: number;
}> {
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_DISCORD_APP_URL}/api/stats`
    );
    return response.data.stats;
  } catch (error) {
    console.error(error);
    return {
      users: 0,
      servers: 0,
      roles: 0,
    };
  }
}

async function getTelegramStats(): Promise<{
  users: number;
  servers: number;
}> {
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_TELEGRAM_APP_URL}/api/stats`
    );
    return response.data.stats;
  } catch (error) {
    console.error(error);
    return {
      users: 0,
      servers: 0,
    };
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ platform: "discord" | "telegram" }>;
}) {
  const { platform } = await searchParams;
  let discordStats = {
    users: 0,
    servers: 0,
    roles: 0,
  };
  let telegramStats = {
    users: 0,
    servers: 0,
  };

  if (platform === "discord" || platform === undefined) {
    discordStats = await getDiscordStats();
  } else {
    telegramStats = await getTelegramStats();
  }

  const formatNumber = (num: number) => {
    if (num === 0) return "—";
    if (num >= 1000) {
      return num.toLocaleString();
    }
    return num.toString();
  };

  return (
    <div className="bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-16 sm:pb-20">
          <div className="text-center">
            {/* Platform Selector */}
            <div className="flex items-center justify-center mb-8">
              <div className="inline-flex items-center gap-2 p-1 bg-muted/20 rounded-lg border border-border">
                <Link
                  href={`/?platform=discord`}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                    platform === "discord" || platform === undefined
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <FaDiscord className="h-4 w-4" />
                  <span className="hidden sm:inline">Discord</span>
                </Link>
                <Link
                  href={`/?platform=telegram`}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                    platform === "telegram"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <FaTelegram className="h-4 w-4" />
                  <span className="hidden sm:inline">Telegram</span>
                </Link>
              </div>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              {platform === "discord" || platform === undefined
                ? "Discord Role"
                : "Telegram Channel"}
              <span className="block text-primary">Management</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              {platform === "discord" || platform === undefined
                ? "Purchase and manage Discord roles with Web3. Secure, transparent, and decentralized role management for your community."
                : "Purchase and manage Telegram channel access with Web3. Secure, transparent, and decentralized channel management for your community."}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={
                  platform === "discord" || platform === undefined
                    ? "/dashboard/discord"
                    : "/dashboard/telegram"
                }
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto cursor-pointer"
                >
                  Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Stats Cards */}
          <div className="w-full flex flex-wrap items-center justify-center gap-12 mb-12">
            <Card className="border w-[300px]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">
                      Total Users
                    </p>
                    <p className="text-3xl font-bold">
                      {formatNumber(
                        platform === "discord" || platform === undefined
                          ? discordStats.users
                          : telegramStats.users
                      )}
                    </p>
                  </div>
                  <Users className="h-10 w-10 text-primary opacity-50 shrink" />
                </div>
              </CardContent>
            </Card>

            <Card className="border w-[300px]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">
                      Total Servers
                    </p>
                    <p className="text-3xl font-bold">
                      {formatNumber(
                        platform === "discord" || platform === undefined
                          ? discordStats.servers
                          : telegramStats.servers
                      )}
                    </p>
                  </div>
                  <Shield className="h-10 w-10 text-primary opacity-50 shrink" />
                </div>
              </CardContent>
            </Card>

            {platform === "discord" ||
              (platform === undefined && (
                <Card className="border w-[300px]">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-1">
                          Total Roles
                        </p>
                        <p className="text-3xl font-bold">
                          {formatNumber(discordStats.roles)}
                        </p>
                      </div>
                      <Activity className="h-10 w-10 text-primary opacity-50 shrink" />
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
