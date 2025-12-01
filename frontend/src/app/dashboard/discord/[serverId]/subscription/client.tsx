"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ServerSubscription } from "@/types/discord";
import axios, { AxiosError } from "axios";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Infinity,
  Server,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useAccount, useBalance, useWalletClient } from "wagmi";
import { withPaymentInterceptor } from "x402-axios";

type RenewalOption = {
  transactions: number | "infinite";
  label: string;
  price: string;
  popular?: boolean;
};

const renewalOptions: RenewalOption[] = [
  {
    transactions: 50,
    label: "50 Transactions",
    price: "1",
  },
  {
    transactions: 100,
    label: "100 Transactions",
    price: "2",
    popular: true,
  },
  {
    transactions: 200,
    label: "200 Transactions",
    price: "3",
  },
];

const baseURL = process.env.NEXT_PUBLIC_DISCORD_APP_URL;

const baseClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default function SubscriptionClient({
  subscription,
}: {
  subscription: ServerSubscription;
}) {
  const params = useParams();
  const router = useRouter();
  const serverId = params.serverId as string;

  const [loading, setLoading] = useState(false);
  const { address } = useAccount();
  const { data: balance } = useBalance({
    address: address,
    token: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  });
  const { data: walletClient } = useWalletClient();

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const getTimeRemaining = (expiryTime: Date) => {
    const now = new Date();
    const diff = new Date(expiryTime).getTime() - now.getTime();
    if (diff <= 0) return { text: "Expired", isExpired: true };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return {
        text: `${days} day${days > 1 ? "s" : ""} remaining`,
        isExpired: false,
      };
    }
    if (hours > 0) {
      return {
        text: `${hours} hour${hours > 1 ? "s" : ""} remaining`,
        isExpired: false,
      };
    }
    return { text: "Expiring soon", isExpired: false };
  };

  const handleRenewal = async (option: RenewalOption) => {
    if (!baseURL) {
      toast.error("Base URL is not set");
      return;
    }

    if (!subscription) {
      toast.error("Subscription not found");
      return;
    }

    if (!address || !walletClient) {
      toast.error("Please connect your wallet");
      return;
    }

    if ((balance?.value || BigInt(0)) < BigInt(option.price)) {
      toast.error(
        `You do not have enough USDC to purchase the role. You need ${option.price} USDC to purchase the subscription.`
      );
      return;
    }

    setLoading(true);
    try {
      const endpointPath = `/api/user/server/my-server/${serverId}/subscription`;
      // @ts-expect-error - walletClient is not typed
      const api = withPaymentInterceptor(baseClient, walletClient);

      await api.post(
        endpointPath,
        {
          amount: option.price,
        },
        {
          withCredentials: true,
        }
      );
      toast.success("Subscription renewed successfully");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof AxiosError
          ? error.status === 429
            ? "You are being rate limited. Please try again later."
            : (error.response?.data as { error: string }).error
          : "Failed to grant access"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!subscription) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8 dark">
        <div className="max-w-7xl mx-auto">
          <Card className="border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                Subscription Not Found
              </h3>
              <p className="text-muted-foreground text-center max-w-md">
                Unable to load subscription information. Please try again later.
              </p>
              <Link href={`/dashboard/discord/${serverId}`}>
                <Button className="mt-4 cursor-pointer">
                  Back to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const timeRemaining = getTimeRemaining(subscription.expiresOn);
  const txnsRemaining = BigInt(subscription.numberOfTxns);
  const isExpiring = timeRemaining.isExpired || txnsRemaining <= 10;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8 dark">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="py-6">
          <Link href={`/dashboard/discord/${serverId}`}>
            <Button
              variant="ghost"
              onClick={() => router.push(`/dashboard/discord/${serverId}`)}
              className="mb-4"
            >
              ← Back to Dashboard
            </Button>
          </Link>
          <div className="text-center">
            <h2 className="text-4xl sm:text-5xl font-bold mb-3">
              Subscription Management
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
              Manage your server subscription, view usage, and renew when
              needed.
            </p>
          </div>
        </div>

        {/* Current Subscription Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Server Info */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Server Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Server Name
                </span>
                <span className="font-semibold">{subscription.serverName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Server ID</span>
                <span className="font-mono text-sm">
                  {subscription.serverDiscordId.slice(0, 8)}...
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                {subscription.isExpired || !subscription.hasTransactionsLeft ? (
                  <Badge variant="destructive">Inactive</Badge>
                ) : isExpiring ? (
                  <Badge variant="destructive">Expiring Soon</Badge>
                ) : (
                  <Badge variant="default" className="bg-green-600">
                    Active
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Subscription Details */}
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Expires On
                  </span>
                </div>
                <span className="font-semibold text-sm">
                  {formatDate(subscription.expiresOn)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Time Remaining
                  </span>
                </div>
                <Badge
                  variant={
                    timeRemaining.isExpired ? "destructive" : "secondary"
                  }
                >
                  {timeRemaining.text}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Transactions Left
                  </span>
                </div>
                <span className="font-bold text-lg">
                  {txnsRemaining.toString() === "-1"
                    ? "Unlimited"
                    : txnsRemaining.toString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert if expiring */}
        {isExpiring && (
          <Card className="border-red-500 bg-red-500/10">
            <CardContent className="flex items-center gap-4 py-4">
              <AlertCircle className="h-8 w-8 text-red-500 shrink-0" />
              <div>
                <h3 className="font-semibold text-lg mb-1">
                  Subscription Needs Attention
                </h3>
                <p className="text-sm text-muted-foreground">
                  {timeRemaining.isExpired
                    ? "Your subscription has expired. Renew now to continue using the bot."
                    : txnsRemaining <= 0
                    ? "You've reached your transaction limit. Renew to get more transactions."
                    : "Your subscription is running low. Consider renewing to avoid service interruption."}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Renewal Options */}
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-2">Renewal Options</h3>
            <p className="text-muted-foreground">
              Choose a plan that fits your needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {renewalOptions.map((option, index) => (
              <Card
                key={index}
                className={`border-2 relative ${
                  option.popular
                    ? "border-primary shadow-lg scale-105"
                    : "border-border"
                } hover:shadow-xl transition-all`}
              >
                {option.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4">
                    {option.transactions === "infinite" ? (
                      <Infinity className="h-12 w-12 text-primary" />
                    ) : (
                      <Zap className="h-12 w-12 text-primary" />
                    )}
                  </div>
                  <CardTitle className="text-2xl">{option.label}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">${option.price}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">
                        {option.transactions === "infinite"
                          ? "Unlimited transactions"
                          : `${option.transactions} transactions`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Valid for 30 days</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">24/7 Support</span>
                    </div>
                  </div>
                  <Button
                    className="w-full cursor-pointer"
                    size="lg"
                    variant={option.popular ? "default" : "outline"}
                    onClick={() => handleRenewal(option)}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      "Renew Now"
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Additional Info */}
        <Card className="border">
          <CardHeader>
            <CardTitle>Important Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              • Transactions are added to your current balance and do not reset
              your existing transactions.
            </p>
            <p>
              • The expiration date is extended by 30 days from the current
              expiration date (or from today if expired).
            </p>
            <p>
              • Unlimited plans never expire and give you unlimited transactions
              for the lifetime of your server.
            </p>
            <p>
              • All payments are processed on the Base Sepolia testnet for
              demonstration purposes.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
