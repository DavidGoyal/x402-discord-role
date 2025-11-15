"use client";

import { useAccount } from "wagmi";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Server, Clock, User, Users, ChevronDown } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface UserRoleClaim {
  id: string;
  userId: string;
  discordId: string;
  username: string;
  roleId: string;
  roleName: string;
  serverId: string;
  serverName: string;
  expiryTime: Date;
  createdAt: Date;
  isExpired: boolean;
}

interface ServerData {
  id: string;
  serverId: string;
  name: string;
}

export default function AdminDashboard() {
  const { isConnected, address } = useAccount();
  const [userClaims, setUserClaims] = useState<UserRoleClaim[]>([]);
  const [loading, setLoading] = useState(false);
  const [servers, setServers] = useState<ServerData[]>([]);
  const [selectedServer, setSelectedServer] = useState<ServerData | null>(null);
  const [serversLoading, setServersLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch user servers - replace with actual API call
  useEffect(() => {
    if (isConnected && address) {
      setServersLoading(true);
      // TODO: Replace with actual API endpoint
      // Example: fetch(`/api/user/servers?address=${address}`)
      // For now, using mock data
      setTimeout(() => {
        // Test wallet address that should show "no servers" state
        const testWalletNoServers = "0x20Ba61d7234F3Bb642b77746a4283DB6F37a5Fc4";
        
        let mockServers: ServerData[] = [];
        
        // If wallet matches test address, return empty array (no servers)
        if (address.toLowerCase() === testWalletNoServers.toLowerCase()) {
          mockServers = [];
        } else {
          // Otherwise, return mock servers for testing
          mockServers = [
            { id: "1", serverId: "111111111111111111", name: "My Discord Server" },
            { id: "2", serverId: "222222222222222222", name: "Another Server" },
            { id: "3", serverId: "333333333333333333", name: "Third Server" },
          ];
        }
        
        setServers(mockServers);
        if (mockServers.length > 0) {
          setSelectedServer(mockServers[0]);
        } else {
          setSelectedServer(null);
        }
        setServersLoading(false);
      }, 500);
    } else {
      setServers([]);
      setSelectedServer(null);
    }
  }, [isConnected, address]);

  // Fetch all user role claims - replace with actual API call
  useEffect(() => {
    if (isConnected) {
      setLoading(true);
      // TODO: Replace with actual API endpoint
      // Example: fetch(`/api/admin/user-claims`)
      // For now, using mock data structure
      setTimeout(() => {
        setUserClaims([
          {
            id: "1",
            userId: "user-1",
            discordId: "123456789012345678",
            username: "john_doe",
            roleId: "987654321",
            roleName: "Premium Member",
            serverId: "111111111111111111",
            serverName: "My Discord Server",
            expiryTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            isExpired: false,
          },
          {
            id: "2",
            userId: "user-2",
            discordId: "987654321098765432",
            username: "jane_smith",
            roleId: "123456789",
            roleName: "VIP Access",
            serverId: "222222222222222222",
            serverName: "Another Server",
            expiryTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            isExpired: false,
          },
          {
            id: "3",
            userId: "user-3",
            discordId: "555555555555555555",
            username: "bob_wilson",
            roleId: "456789123",
            roleName: "Pro Member",
            serverId: "111111111111111111",
            serverName: "My Discord Server",
            expiryTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
            isExpired: true,
          },
        ]);
        setLoading(false);
      }, 500);
    } else {
      setUserClaims([]);
    }
  }, [isConnected]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const formatDate = (date: Date) => {
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

  // Filter claims by selected server
  const filteredClaims = selectedServer
    ? userClaims.filter((claim) => claim.serverId === selectedServer.serverId)
    : userClaims;

  const activeClaims = filteredClaims.filter((claim) => !claim.isExpired).length;
  const expiredClaims = filteredClaims.filter((claim) => claim.isExpired).length;

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
              View and manage all claimed Discord roles across your servers. Track expiration dates, user details, and server information.
            </p>
          </div>
        </div>

        {/* Stats */}
        {isConnected && filteredClaims.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Claims</p>
                    <p className="text-2xl font-bold">{filteredClaims.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card className="border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Active Roles</p>
                    <p className="text-2xl font-bold text-green-500">{activeClaims}</p>
                  </div>
                  <Shield className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Expired Roles</p>
                    <p className="text-2xl font-bold text-red-500">{expiredClaims}</p>
                  </div>
                  <Clock className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>
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
                Connect your wallet to access the admin dashboard and view user role claims.
              </p>
            </CardContent>
          </Card>
        ) : loading ? (
          <Card className="border">
            <CardContent className="flex items-center justify-center py-12">
              <div className="animate-pulse space-y-4 w-full">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ) : !serversLoading && servers.length === 0 ? (
          <Card className="border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Server className="h-16 w-16 text-muted-foreground mb-6 opacity-50" />
              <h3 className="text-2xl font-bold mb-3">
                No Servers Owned
              </h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                You don&apos;t own any Discord servers with this wallet address. To manage role claims, you need to own at least one Discord server.
              </p>
              <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border max-w-md">
                <p className="text-sm text-muted-foreground text-center">
                  <span className="font-semibold text-foreground">Note:</span> Only server owners can access the admin dashboard to view and manage role claims.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : userClaims.length === 0 ? (
          <Card className="border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                No Role Claims Found
              </h3>
              <p className="text-muted-foreground text-center max-w-md">
                No users have claimed any roles yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-2xl font-semibold tracking-tight">
                User Role Claims
              </h2>
              <div className="flex items-center gap-4">
                {servers.length > 1 && (
                  <div className="relative" ref={dropdownRef}>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => setIsOpen(!isOpen)}
                    >
                      <Server className="h-4 w-4" />
                      <span className="hidden sm:inline">
                        {selectedServer?.name || "Select Server"}
                      </span>
                      <span className="sm:hidden">Server</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    {isOpen && (
                      <div className="absolute top-full right-0 mt-1 w-56 rounded-md border bg-popover shadow-md z-50">
                        <div className="p-1">
                          {servers.map((server) => (
                            <button
                              key={server.id}
                              onClick={() => {
                                setSelectedServer(server);
                                setIsOpen(false);
                              }}
                              className={cn(
                                "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-muted transition-colors text-left",
                                selectedServer?.id === server.id && "bg-muted"
                              )}
                            >
                              <Server className="h-4 w-4" />
                              {server.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {servers.length === 1 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Server className="h-4 w-4" />
                    <span className="hidden sm:inline">{servers[0].name}</span>
                  </div>
                )}
                <Badge variant="secondary">
                  {filteredClaims.length} {filteredClaims.length === 1 ? "Claim" : "Claims"}
                </Badge>
              </div>
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
                          Role
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
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClaims.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-12">
                            <div className="flex flex-col items-center justify-center text-center">
                              <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                              <h3 className="text-lg font-semibold mb-2">
                                No Role Claims Found
                              </h3>
                              <p className="text-sm text-muted-foreground max-w-md">
                                {selectedServer
                                  ? `No users have claimed roles for "${selectedServer.name}" yet.`
                                  : "No users have claimed any roles yet."}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredClaims.map((claim, index) => (
                          <tr
                            key={claim.id}
                            className={cn(
                              "border-b border-border transition-colors hover:bg-muted/50",
                              claim.isExpired && "opacity-60"
                            )}
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-primary" />
                                <div>
                                  <p className="font-medium text-sm">{claim.username}</p>
                                  <p className="text-xs text-muted-foreground font-mono">
                                    {claim.discordId.slice(0, 10)}...
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-sm">{claim.roleName}</p>
                                  <p className="text-xs text-muted-foreground font-mono">
                                    {claim.roleId.slice(0, 8)}...
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Server className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-sm">{claim.serverName}</p>
                                  <p className="text-xs text-muted-foreground font-mono">
                                    {claim.serverId.slice(0, 8)}...
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm">{formatDate(claim.expiryTime)}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge
                                variant={
                                  claim.isExpired
                                    ? "destructive"
                                    : new Date(claim.expiryTime).getTime() -
                                        Date.now() <
                                      7 * 24 * 60 * 60 * 1000
                                    ? "destructive"
                                    : "secondary"
                                }
                                className="text-xs"
                              >
                                {getTimeRemaining(claim.expiryTime)}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <span className="text-sm text-muted-foreground">
                                {formatDate(claim.createdAt)}
                              </span>
                            </td>
                            <td className="p-4">
                              {!claim.isExpired ? (
                                <Badge variant="default" className="text-xs">
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="text-xs">
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

