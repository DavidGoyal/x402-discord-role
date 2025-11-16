"use client";

import { useState } from "react";
import { toast } from "sonner";
import { formatUnits } from "viem";
import { useAccount, useBalance, useWalletClient } from "wagmi";
import axios, { AxiosError } from "axios";
import { withPaymentInterceptor } from "x402-axios";
import { useRouter } from "next/navigation";
import { Invoice, Server, User } from "@/types/telegram";

const baseURL = process.env.NEXT_PUBLIC_TELEGRAM_APP_URL;

const baseClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

function HomeClient({
  invoice,
  user,
  server,
}: {
  invoice: Invoice;
  user: User;
  server: Server;
}) {
  const router = useRouter();

  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({
    address: address,
    token: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  });
  const { data: walletClient } = useWalletClient();
  const [loading, setLoading] = useState(false);

  const paymentAmount =
    (Number(server.costInUsdc) * invoice.roleApplicableTime) / 86400;

  const handlePay = async () => {
    setLoading(true);
    if (!baseURL) {
      toast.error("Base URL is not set");
      return;
    }

    if (!address || !walletClient) {
      toast.error("Please connect your wallet");
      return;
    }

    if ((balance?.value || BigInt(0)) < BigInt(paymentAmount)) {
      toast.error(
        `You do not have enough USDC to purchase the role. You need ${paymentAmount} USDC to purchase the role.`
      );
      return;
    }

    setLoading(true);
    try {
      const endpointPath = "/api/user/access";
      // @ts-expect-error - walletClient is not typed
      const api = withPaymentInterceptor(baseClient, walletClient);

      await api.post(endpointPath, {
        telegramId: user.telegramId,
        networkId: "c4191e43-55ee-49ad-844a-52d50dafb28a",
        serverId: server.serverId,
        roleApplicableTime: invoice.roleApplicableTime,
        token: invoice.token,
      });
      toast.success("Access granted");
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

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold">Buy Discord Role</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Unlock premium features with Web3
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
          {/* Role Badge Section */}
          <div className="relative p-8 sm:p-12 text-center bg-muted/20">
            <div
              className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full mb-4 shadow-lg"
              style={{ backgroundColor: "#5865F2" }}
            >
              <svg
                className="w-10 h-10 sm:w-12 sm:h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {/* Wallet Info */}
            {isConnected && address && (
              <div className="mb-6 p-4 bg-muted/30 rounded-xl border border-border">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-1 font-medium">
                      Connected Wallet
                    </p>
                    <p className="text-xs sm:text-sm font-mono truncate">
                      {address}
                    </p>
                  </div>
                  {balance && (
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">
                        Balance
                      </p>
                      <p className="text-sm sm:text-base font-bold">
                        {parseFloat(formatUnits(balance.value, 6)).toFixed(4)}{" "}
                        USDC
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pricing */}
            <div className="mb-8 p-6 bg-muted/30 rounded-xl border border-border">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Price</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-bold">
                      {paymentAmount / 1000000} USDC
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pay Button */}
            <div className="space-y-3">
              {!isConnected ? (
                <p className="w-full bg-primary text-primary-foreground hover:bg-primary/90 border border-border font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-base sm:text-lg text-center">
                  Connect Wallet to Purchase
                </p>
              ) : (
                <button
                  onClick={handlePay}
                  disabled={
                    loading ||
                    (balance?.value || BigInt(0)) < BigInt(paymentAmount)
                  }
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed border border-border font-semibold py-4 px-6 rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:transform-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-base sm:text-lg"
                >
                  {loading ? "Processing..." : "Purchase Role"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomeClient;
