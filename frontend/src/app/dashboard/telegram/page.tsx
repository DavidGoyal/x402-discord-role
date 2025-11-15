"use client";

import { useAccount } from "wagmi";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, MessageSquare, Clock, User, Users, ChevronDown } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface UserChannelClaim {
  id: string;
  userId: string;
  telegramId: string;
  username: string;
  channelId: string;
  channelName: string;
  channelAccessId: string;
  channelAccessName: string;
  expiryTime: Date;
  createdAt: Date;
  isExpired: boolean;
}

interface ChannelData {
  id: string;
  channelId: string;
  name: string;
}

export default function TelegramAdminDashboard() {
  const { isConnected, address } = useAccount();
  const [userClaims, setUserClaims] = useState<UserChannelClaim[]>([]);
  const [loading, setLoading] = useState(false);
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<ChannelData | null>(null);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch user channels - replace with actual API call
  useEffect(() => {
    if (isConnected && address) {
      setChannelsLoading(true);
      // TODO: Replace with actual API endpoint
      // Example: fetch(`/api/user/channels?address=${address}`)
      // For now, using mock data
      setTimeout(() => {
        // Test wallet address that should show "no channels" state
        const testWalletNoChannels = "0x20Ba61d7234F3Bb642b77746a4283DB6F37a5Fc4";
        
        let mockChannels: ChannelData[] = [];
        
        // If wallet matches test address, return empty array (no channels)
        if (address.toLowerCase() === testWalletNoChannels.toLowerCase()) {
          mockChannels = [];
        } else {
          // Otherwise, return mock channels for testing
          mockChannels = [
            { id: "1", channelId: "111111111111111111", name: "My Telegram Channel" },
            { id: "2", channelId: "222222222222222222", name: "Another Channel" },
            { id: "3", channelId: "333333333333333333", name: "Third Channel" },
          ];
        }
        
        setChannels(mockChannels);
        if (mockChannels.length > 0) {
          setSelectedChannel(mockChannels[0]);
        } else {
          setSelectedChannel(null);
        }
        setChannelsLoading(false);
      }, 500);
    } else {
      setChannels([]);
      setSelectedChannel(null);
    }
  }, [isConnected, address]);

  // Fetch all user channel claims - replace with actual API call
  useEffect(() => {
    if (isConnected) {
      setLoading(true);
      // TODO: Replace with actual API endpoint
      // Example: fetch(`/api/admin/channel-claims`)
      // For now, using mock data structure
      setTimeout(() => {
        setUserClaims([
          {
            id: "1",
            userId: "user-1",
            telegramId: "123456789",
            username: "john_doe",
            channelId: "111111111111111111",
            channelName: "My Telegram Channel",
            channelAccessId: "987654321",
            channelAccessName: "Premium Access",
            expiryTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            isExpired: false,
          },
          {
            id: "2",
            userId: "user-2",
            telegramId: "987654321",
            username: "jane_smith",
            channelId: "222222222222222222",
            channelName: "Another Channel",
            channelAccessId: "123456789",
            channelAccessName: "VIP Access",
            expiryTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            isExpired: false,
          },
          {
            id: "3",
            userId: "user-3",
            telegramId: "555555555",
            username: "bob_wilson",
            channelId: "111111111111111111",
            channelName: "My Telegram Channel",
            channelAccessId: "456789123",
            channelAccessName: "Pro Access",
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

  // Filter claims by selected channel
  const filteredClaims = selectedChannel
    ? userClaims.filter((claim) => claim.channelId === selectedChannel.channelId)
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
              Telegram Admin Panel
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
              View and manage all claimed Telegram channel access across your channels. Track expiration dates, user details, and channel information.
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
                    <p className="text-sm text-muted-foreground mb-1">Active Access</p>
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
                    <p className="text-sm text-muted-foreground mb-1">Expired Access</p>
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
                Connect your wallet to access the admin dashboard and view user channel access claims.
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
        ) : !channelsLoading && channels.length === 0 ? (
          <Card className="border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-16 w-16 text-muted-foreground mb-6 opacity-50" />
              <h3 className="text-2xl font-bold mb-3">
                No Channels Owned
              </h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                You don&apos;t own any Telegram channels with this wallet address. To manage channel access claims, you need to own at least one Telegram channel.
              </p>
              <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border max-w-md">
                <p className="text-sm text-muted-foreground text-center">
                  <span className="font-semibold text-foreground">Note:</span> Only channel owners can access the admin dashboard to view and manage channel access claims.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : userClaims.length === 0 ? (
          <Card className="border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                No Channel Access Claims Found
              </h3>
              <p className="text-muted-foreground text-center max-w-md">
                No users have claimed any channel access yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-2xl font-semibold tracking-tight">
                User Channel Access Claims
              </h2>
              <div className="flex items-center gap-4">
                {channels.length > 1 && (
                  <div className="relative" ref={dropdownRef}>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => setIsOpen(!isOpen)}
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span className="hidden sm:inline">
                        {selectedChannel?.name || "Select Channel"}
                      </span>
                      <span className="sm:hidden">Channel</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    {isOpen && (
                      <div className="absolute top-full right-0 mt-1 w-56 rounded-md border bg-popover shadow-md z-50">
                        <div className="p-1">
                          {channels.map((channel) => (
                            <button
                              key={channel.id}
                              onClick={() => {
                                setSelectedChannel(channel);
                                setIsOpen(false);
                              }}
                              className={cn(
                                "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-muted transition-colors text-left",
                                selectedChannel?.id === channel.id && "bg-muted"
                              )}
                            >
                              <MessageSquare className="h-4 w-4" />
                              {channel.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {channels.length === 1 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    <span className="hidden sm:inline">{channels[0].name}</span>
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
                          Access Type
                        </th>
                        <th className="text-left p-4 text-sm font-semibold text-muted-foreground">
                          Channel
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
                                No Channel Access Claims Found
                              </h3>
                              <p className="text-sm text-muted-foreground max-w-md">
                                {selectedChannel
                                  ? `No users have claimed channel access for "${selectedChannel.name}" yet.`
                                  : "No users have claimed any channel access yet."}
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
                                    {claim.telegramId.slice(0, 10)}...
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-sm">{claim.channelAccessName}</p>
                                  <p className="text-xs text-muted-foreground font-mono">
                                    {claim.channelAccessId.slice(0, 8)}...
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-sm">{claim.channelName}</p>
                                  <p className="text-xs text-muted-foreground font-mono">
                                    {claim.channelId.slice(0, 8)}...
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

