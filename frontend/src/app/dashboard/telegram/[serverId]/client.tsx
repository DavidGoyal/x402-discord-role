"use client";

import RevenueChart from "@/components/revenue-chart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { RoleAssigned } from "@/types/telegram";
import { Clock, Server, Shield, User, Users } from "lucide-react";
import Link from "next/link";
import { FaExternalLinkAlt } from "react-icons/fa";
import { useAccount } from "wagmi";

export default function AdminDashboard({
  serverId,
  serverName,
  rolesAssigned,
}: {
  serverId: string;
  serverName: string;
  rolesAssigned: RoleAssigned[];
}) {
  const { isConnected } = useAccount();

  const formatDate = (date: Date) => {
    console.log(date);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getTimeRemaining = (expiryTime: Date) => {
    const now = new Date();
    const diff = expiryTime.getTime() - now.getTime();
    if (diff <= 0) return "Expired";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} remaining`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} remaining`;
    return "Expiring soon";
  };

  const activeClaims = rolesAssigned.filter(
    (roleAssigned) => roleAssigned.active
  ).length;
  const expiredClaims = rolesAssigned.filter(
    (roleAssigned) => !roleAssigned.active
  ).length;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8 dark">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Section */}
        <div className="py-6">
          <div className="text-center">
            <h2 className="text-4xl sm:text-5xl font-bold mb-3">
              Telegram Admin Panel
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
              View and manage all bought subscriptions across your servers.
              Track expiration dates, user details, and server information.
            </p>
          </div>
        </div>

        {/* Stats */}
        {isConnected && rolesAssigned.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Total Subscriptions Bought
                    </p>
                    <p className="text-2xl font-bold">{rolesAssigned.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card className="border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Active Subscriptions
                    </p>
                    <p className="text-2xl font-bold text-green-500">
                      {activeClaims}
                    </p>
                  </div>
                  <Shield className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Expired Subscriptions
                    </p>
                    <p className="text-2xl font-bold text-red-500">
                      {expiredClaims}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Revenue Chart */}
        {isConnected && rolesAssigned.length > 0 && (
          <RevenueChart serverId={serverId} isDiscord={false} />
        )}

        {/* User Claims Section */}
        {!isConnected ? (
          <Card className="border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                Connect Your Wallet
              </h3>
              <p className="text-muted-foreground text-center max-w-md">
                Connect your wallet to access the admin dashboard and view user
                role claims.
              </p>
            </CardContent>
          </Card>
        ) : rolesAssigned.length === 0 ? (
          <Card className="border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                No Subscriptions Bought Found
              </h3>
              <p className="text-muted-foreground text-center max-w-md">
                No users have bought any subscriptions yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-2xl font-semibold tracking-tight">
                User Subscriptions Bought
              </h2>
            </div>

            <Card className="border">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-4 text-sm font-semibold text-muted-foreground">
                          User
                        </th>
                        <th className="text-left p-4 text-sm font-semibold text-muted-foreground">
                          Server
                        </th>
                        <th className="text-left p-4 text-sm font-semibold text-muted-foreground">
                          Expires
                        </th>
                        <th className="text-left p-4 text-sm font-semibold text-muted-foreground">
                          Time Remaining
                        </th>
                        <th className="text-left p-4 text-sm font-semibold text-muted-foreground">
                          Claimed
                        </th>
                        <th className="text-left p-4 text-sm font-semibold text-muted-foreground">
                          Transaction
                        </th>
                        <th className="text-left p-4 text-sm font-semibold text-muted-foreground">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rolesAssigned.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-12">
                            <div className="flex flex-col items-center justify-center text-center">
                              <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                              <h3 className="text-lg font-semibold mb-2">
                                No Subscriptions Bought Found
                              </h3>
                              <p className="text-sm text-muted-foreground max-w-md">
                                {`No users have bought subscriptions for "${serverName}" yet.`}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        rolesAssigned.map((roleAssigned, index) => (
                          <tr
                            key={index}
                            className={cn(
                              "border-b border-border transition-colors hover:bg-muted/50",
                              !roleAssigned.active && "opacity-60"
                            )}
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-primary" />
                                <div>
                                  <p className="text-sm">
                                    {roleAssigned.username}
                                  </p>
                                  <p className="text-xs text-muted-foreground font-mono">
                                    {roleAssigned.userId.slice(0, 8)}...
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Server className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-sm">{serverName}</p>
                                  <p className="text-xs text-muted-foreground font-mono">
                                    {serverId.slice(0, 8)}...
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm">
                                  {formatDate(new Date(roleAssigned.expiresOn))}
                                </span>
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge
                                variant={
                                  !roleAssigned.active
                                    ? "destructive"
                                    : new Date(
                                        roleAssigned.expiresOn
                                      ).getTime() -
                                        new Date().getTime() <
                                      7 * 24 * 60 * 60 * 1000
                                    ? "destructive"
                                    : "secondary"
                                }
                                className="text-xs"
                              >
                                {getTimeRemaining(
                                  new Date(roleAssigned.expiresOn)
                                )}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <span className="text-sm text-muted-foreground">
                                {formatDate(new Date(roleAssigned.createdAt))}
                              </span>
                            </td>
                            <td className="p-4">
                              <Link
                                href={`https://sepolia.basescan.org/tx/${roleAssigned.txnLink}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline"
                              >
                                <FaExternalLinkAlt className="h-4 w-4 ml-2" />
                              </Link>
                            </td>
                            <td className="p-4">
                              {roleAssigned.active ? (
                                <Badge variant="default" className="text-xs">
                                  Active
                                </Badge>
                              ) : (
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  Expired
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
