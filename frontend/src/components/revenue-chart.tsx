"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface RevenueData {
  date: string;
  revenue: number;
}

interface RevenueChartProps {
  serverId: string;
  isDiscord: boolean;
}

export default function RevenueChart({
  serverId,
  isDiscord,
}: RevenueChartProps) {
  const [period, setPeriod] = useState<"day" | "week" | "month">("day");
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);

  const fetchRevenueData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${
          isDiscord
            ? process.env.NEXT_PUBLIC_DISCORD_APP_URL
            : process.env.NEXT_PUBLIC_TELEGRAM_APP_URL
        }/api/server/my-server/${serverId}/revenue`,
        {
          params: {
            period,
          },
          withCredentials: true,
        }
      );
      if (response.data.success) {
        setRevenueData(response.data.data);
        const total = response.data.data.reduce(
          (sum: number, item: RevenueData) => sum + item.revenue,
          0
        );
        setTotalRevenue(total);
      }
    } catch (error) {
      console.error("Error fetching revenue data:", error);
      setRevenueData([]);
      setTotalRevenue(0);
    } finally {
      setLoading(false);
    }
  }, [serverId, period, isDiscord]);

  useEffect(() => {
    fetchRevenueData();
  }, [fetchRevenueData]);

  const formatDate = (dateString: string) => {
    if (period === "week") {
      // Format week number (e.g., "2024-W45" -> "Week 45, 2024")
      const [year, week] = dateString.split("-W");
      return `Week ${week}, ${year}`;
    } else if (period === "month") {
      // Format month (e.g., "2024-11" -> "Nov 2024")
      const [year, month] = dateString.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
    } else {
      // Format day (e.g., "2024-11-17" -> "Nov 17")
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold mb-1">
            {formatDate(payload[0].payload.date)}
          </p>
          <p className="text-sm text-primary font-bold">
            ${payload[0].value.toFixed(2)} USDC
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Revenue Analytics
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Track your server&apos;s revenue over time
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={period === "day" ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod("day")}
              >
                Daily
              </Button>
              <Button
                variant={period === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod("week")}
              >
                Weekly
              </Button>
              <Button
                variant={period === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod("month")}
              >
                Monthly
              </Button>
            </div>
          </div>

          {/* Total Revenue Badge */}
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-500" />
            <span className="text-sm text-muted-foreground">
              Total Revenue:
            </span>
            <Badge variant="default" className="text-base font-bold">
              ${totalRevenue.toFixed(2)} USDC
            </Badge>
          </div>

          {/* Chart */}
          <div className="w-full h-[400px] mt-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-pulse text-muted-foreground">
                  Loading chart data...
                </div>
              </div>
            ) : revenueData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <h4 className="text-lg font-semibold mb-2">No Revenue Data</h4>
                <p className="text-sm text-muted-foreground max-w-md">
                  No revenue has been generated yet. Revenue will appear here
                  once users start claiming roles.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    className="text-xs"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    className="text-xs"
                    label={{
                      value: "Revenue (USDC)",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Revenue (USDC)"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
