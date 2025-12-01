"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MyServer } from "@/types/discord";
import { Server, Shield } from "lucide-react";
import { useRouter } from "nextjs-toploader/app";
import { useAccount } from "wagmi";

export default function AdminDashboard({ servers }: { servers: MyServer[] }) {
  const { isConnected } = useAccount();
  const router = useRouter();

  const handleServerClick = (serverId: string) => {
    router.push(`/dashboard/discord/${serverId}`);
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8 dark">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Section */}
        <div className="py-6">
          <div className="text-center">
            <h2 className="text-4xl sm:text-5xl font-bold mb-3">
              Discord Admin Panel
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
              View and manage all claimed Discord roles across your servers.
              Track expiration dates, user details, and server information.
            </p>
          </div>
        </div>

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
        ) : servers.length === 0 ? (
          <Card className="border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Server className="h-16 w-16 text-muted-foreground mb-6 opacity-50" />
              <h3 className="text-2xl font-bold mb-3">No Servers Owned</h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                You don&apos;t own any Discord servers with this wallet address.
                To manage role claims, you need to own at least one Discord
                server.
              </p>
              <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border max-w-md">
                <p className="text-sm text-muted-foreground text-center">
                  <span className="font-semibold text-foreground">Note:</span>{" "}
                  Only server owners can access the admin dashboard to view and
                  manage role claims.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-2xl font-semibold tracking-tight">
                Servers Owned
              </h2>
            </div>

            <Card className="border">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-4 text-sm font-semibold text-muted-foreground">
                          S.No.
                        </th>
                        <th className="text-left p-4 text-sm font-semibold text-muted-foreground">
                          Name
                        </th>
                        <th className="text-left p-4 text-sm font-semibold text-muted-foreground">
                          Roles Configured
                        </th>
                        <th className="text-left p-4 text-sm font-semibold text-muted-foreground">
                          Receiver Address
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {servers.map((server, index) => (
                        <tr
                          className={cn(
                            "border-b border-border transition-colors hover:bg-muted/50 cursor-pointer"
                          )}
                          key={server.id}
                          onClick={() =>
                            handleServerClick(server.serverDiscordId)
                          }
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{index + 1}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-muted-foreground" />
                              <p className="text-sm">{server.serverName}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Server className="h-4 w-4 text-muted-foreground" />
                              <p className="text-sm">{server.roleCount}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-sm text-muted-foreground">
                              {server.walletAddresses}
                            </span>
                          </td>
                        </tr>
                      ))}
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
