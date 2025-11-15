"use client";

import { Shield, Server, Zap, ArrowRight, Users, TrendingUp, Activity, MessageSquare } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { FaDiscord } from "react-icons/fa6";
import { FaTelegram } from "react-icons/fa6";
import { cn } from "@/lib/utils";

type Platform = "discord" | "telegram";

export default function Home() {
  const [platform, setPlatform] = useState<Platform>("discord");
  const [loading, setLoading] = useState(false); // Set to false to show initial state
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeRoles: 0,
    totalRevenue: 0,
    servers: 0,
  });
  const [weeklyData, setWeeklyData] = useState<Array<{ day: string; value: number; color: string }>>([]);
  const [monthlyData, setMonthlyData] = useState<Array<{ x: number; y: number; value: number }>>([]);
  const [totalPurchases, setTotalPurchases] = useState(0);

  useEffect(() => {
    // Simulate loading data
    // Uncomment the setTimeout below to see loading state, or keep it commented to see 0 values
    // setTimeout(() => {
    //   // TODO: Replace with actual API call
    //   // For now, using mock data
    //   setStats({
    //     totalUsers: 12458,
    //     activeRoles: 8234,
    //     totalRevenue: 124500,
    //     servers: 342,
    //   });
    //   setWeeklyData([
    //     { day: "Mon", value: 85, color: "chart-1" },
    //     { day: "Tue", value: 92, color: "chart-2" },
    //     { day: "Wed", value: 78, color: "chart-3" },
    //     { day: "Thu", value: 95, color: "chart-4" },
    //     { day: "Fri", value: 88, color: "chart-5" },
    //     { day: "Sat", value: 105, color: "chart-1" },
    //     { day: "Sun", value: 98, color: "chart-2" },
    //   ]);
    //   setMonthlyData([
    //     { x: 0, y: 200, value: 42 },
    //     { x: 57, y: 180, value: 58 },
    //     { x: 114, y: 160, value: 65 },
    //     { x: 171, y: 140, value: 72 },
    //     { x: 228, y: 145, value: 68 },
    //     { x: 285, y: 130, value: 85 },
    //     { x: 342, y: 110, value: 92 },
    //     { x: 400, y: 100, value: 98 },
    //   ]);
    //   setTotalPurchases(522);
    //   setLoading(false);
    // }, 1000);
  }, []);

  const formatNumber = (num: number) => {
    if (num === 0) return "—";
    if (num >= 1000) {
      return num.toLocaleString();
    }
    return num.toString();
  };

  const formatCurrency = (num: number) => {
    if (num === 0) return "—";
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `$${(num / 1000).toFixed(1)}K`;
    }
    return `$${num.toLocaleString()}`;
  };
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 sm:pt-24 sm:pb-20">
          <div className="text-center">
            {/* Platform Selector */}
            <div className="flex items-center justify-center mb-8">
              <div className="inline-flex items-center gap-2 p-1 bg-muted/20 rounded-lg border border-border">
                <button
                  onClick={() => setPlatform("discord")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                    platform === "discord"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <FaDiscord className="h-4 w-4" />
                  <span className="hidden sm:inline">Discord</span>
                </button>
                <button
                  onClick={() => setPlatform("telegram")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                    platform === "telegram"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <FaTelegram className="h-4 w-4" />
                  <span className="hidden sm:inline">Telegram</span>
                </button>
              </div>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              {platform === "discord" ? "Discord Role" : "Telegram Channel"}
              <span className="block text-primary">Management</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              {platform === "discord"
                ? "Purchase and manage Discord roles with Web3. Secure, transparent, and decentralized role management for your community."
                : "Purchase and manage Telegram channel access with Web3. Secure, transparent, and decentralized channel management for your community."}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={platform === "discord" ? "/dashboard" : "/dashboard/telegram"}>
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-20 sm:py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card className="border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">Total Users</p>
                    {loading ? (
                      <div className="h-9 w-24 bg-muted rounded animate-pulse mb-2" />
                    ) : (
                      <p className="text-3xl font-bold">{formatNumber(stats.totalUsers)}</p>
                    )}
                    {!loading && stats.totalUsers > 0 && (
                      <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        +12.5% from last month
                      </p>
                    )}
                  </div>
                  <Users className="h-10 w-10 text-primary opacity-50 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card className="border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">
                      {platform === "discord" ? "Active Roles" : "Active Channels"}
                    </p>
                    {loading ? (
                      <div className="h-9 w-24 bg-muted rounded animate-pulse mb-2" />
                    ) : (
                      <p className="text-3xl font-bold">{formatNumber(stats.activeRoles)}</p>
                    )}
                    {!loading && stats.activeRoles > 0 && (
                      <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        +8.2% from last month
                      </p>
                    )}
                  </div>
                  <Shield className="h-10 w-10 text-primary opacity-50 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card className="border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                    {loading ? (
                      <div className="h-9 w-24 bg-muted rounded animate-pulse mb-2" />
                    ) : (
                      <p className="text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                    )}
                    {!loading && stats.totalRevenue > 0 && (
                      <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        +15.3% from last month
                      </p>
                    )}
                  </div>
                  <Activity className="h-10 w-10 text-primary opacity-50 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card className="border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">
                      {platform === "discord" ? "Servers" : "Channels"}
                    </p>
                    {loading ? (
                      <div className="h-9 w-24 bg-muted rounded animate-pulse mb-2" />
                    ) : (
                      <p className="text-3xl font-bold">{formatNumber(stats.servers)}</p>
                    )}
                    {!loading && stats.servers > 0 && (
                      <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        +5.1% from last month
                      </p>
                    )}
                  </div>
                  {platform === "discord" ? (
                    <Server className="h-10 w-10 text-primary opacity-50 flex-shrink-0" />
                  ) : (
                    <MessageSquare className="h-10 w-10 text-primary opacity-50 flex-shrink-0" />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart - Role Purchases */}
            <Card className="border">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-6">
                  {platform === "discord" ? "Role Purchases" : "Channel Access Purchases"} (Last 7 Days)
                </h3>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="h-4 w-10 bg-muted rounded animate-pulse" />
                        <div className="flex-1 h-8 bg-muted rounded-full animate-pulse" />
                        <div className="h-4 w-12 bg-muted rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : weeklyData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Activity className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                    <p className="text-muted-foreground text-center">No purchase data available</p>
                    <p className="text-sm text-muted-foreground/70 text-center mt-1">Data will appear here once purchases are made</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {weeklyData.map((item, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground w-10">{item.day}</span>
                        <div className="flex-1 h-8 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${item.value}%`,
                              backgroundColor: `var(--color-${item.color})`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">{item.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Role Purchases Graph */}
            <Card className="border">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-6">
                  {platform === "discord" ? "Role Purchases" : "Channel Access Purchases"} (Last 30 Days)
                </h3>
                {loading ? (
                  <div className="relative h-80 mb-4 bg-muted/20 rounded-lg p-4">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="space-y-2 w-full px-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="h-2 bg-muted rounded animate-pulse" />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : monthlyData.length === 0 ? (
                  <div className="relative h-80 mb-4 bg-muted/20 rounded-lg p-4 flex items-center justify-center">
                    <div className="text-center">
                      <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground">No purchase data available</p>
                      <p className="text-sm text-muted-foreground/70 mt-1">Data will appear here once purchases are made</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="relative h-80 mb-4 bg-muted/20 rounded-lg p-4">
                      {/* Shaded Area Chart */}
                      <svg className="w-full h-full" viewBox="0 0 400 250" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity="0.6" />
                            <stop offset="50%" stopColor="var(--color-chart-1)" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity="0.1" />
                          </linearGradient>
                          <filter id="glow">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                            <feMerge>
                              <feMergeNode in="coloredBlur"/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                        </defs>
                        {/* Grid lines */}
                        {[0, 50, 100, 150, 200, 250].map((y, i) => (
                          <line
                            key={i}
                            x1="0"
                            y1={y}
                            x2="400"
                            y2={y}
                            stroke="var(--color-border)"
                            strokeWidth="1"
                            strokeDasharray="2,2"
                            opacity="0.3"
                          />
                        ))}
                        {/* Area fill */}
                        {monthlyData.length > 0 && (
                          <path
                            d={`M ${monthlyData.map(p => `${p.x},${p.y}`).join(" L ")} L 400,250 L 0,250 Z`}
                            fill="url(#areaGradient)"
                            className="transition-opacity hover:opacity-90"
                          />
                        )}
                        {/* Line with glow */}
                        {monthlyData.length > 0 && (
                          <path
                            d={`M ${monthlyData.map(p => `${p.x},${p.y}`).join(" L ")}`}
                            fill="none"
                            stroke="var(--color-chart-1)"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            filter="url(#glow)"
                            className="transition-all"
                          />
                        )}
                        {/* Data points */}
                        {monthlyData.map((point, index) => (
                          <g key={index} className="group">
                            <circle
                              cx={point.x}
                              cy={point.y}
                              r="8"
                              fill="var(--color-chart-1)"
                              stroke="var(--color-background)"
                              strokeWidth="2"
                              className="transition-all group-hover:r-10 cursor-pointer"
                            />
                            <text
                              x={point.x}
                              y={point.y - 15}
                              textAnchor="middle"
                              className="text-xs font-bold fill-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              {point.value}
                            </text>
                          </g>
                        ))}
                      </svg>
                      {/* Day labels */}
                      <div className="absolute bottom-2 left-4 right-4 flex justify-between">
                        {["1", "5", "10", "15", "20", "25", "30"].map((day, index) => (
                          <span key={index} className="text-xs text-muted-foreground font-medium">
                            Day {day}
                          </span>
                        ))}
                      </div>
                      {/* Y-axis labels */}
                      <div className="absolute left-0 top-4 bottom-12 flex flex-col justify-between text-xs text-muted-foreground">
                        <span>100</span>
                        <span>75</span>
                        <span>50</span>
                        <span>25</span>
                        <span>0</span>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-border">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total Purchases</span>
                        <span className="font-bold text-lg">{totalPurchases > 0 ? totalPurchases : "—"}</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
