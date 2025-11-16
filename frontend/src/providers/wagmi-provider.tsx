"use client";

import {
  AuthenticationStatus,
  createAuthenticationAdapter,
  darkTheme,
  RainbowKitAuthenticationProvider,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { createSiweMessage } from "viem/siwe";
import { WagmiProvider } from "wagmi";
import { config } from "../config/config";
import { useRouter } from "next/navigation";

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  const myTheme = darkTheme({
    accentColor: "white",
    accentColorForeground: "black",
    borderRadius: "none",
  });
  const [status, setStatus] = useState<AuthenticationStatus>("unauthenticated");
  const router = useRouter();

  const authenticationAdapter = createAuthenticationAdapter({
    getNonce: async () => {
      const response = await fetch("/api/user/nonce");
      const data = await response.json();
      return data.nonce;
    },
    createMessage: ({ nonce, address, chainId }) => {
      const message = createSiweMessage({
        domain: window.location.host,
        address,
        statement:
          "Welcome to x402RoleAccess. Signing is the only way we can truly know that you are the owner of the wallet you are connecting. Signing is a safe, gas-less transaction that does not in any way give x402RoleAccess permission to perform any transactions with your wallet.",
        uri: window.location.origin,
        version: "1",
        chainId,
        nonce,
      });
      return message;
    },
    verify: async ({ message, signature }) => {
      const verifyRes = await fetch("/api/user/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, signature }),
      });
      const data = await verifyRes.json();
      if (data.success) {
        setStatus("authenticated");
      }
      router.refresh();
      return data.success;
    },
    signOut: async () => {
      await fetch("/api/user/logout", {
        method: "POST",
      });
      router.refresh();
      setStatus("unauthenticated");
    },
  });

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/user/profile");
        const data = await response.json();
        if (data.success) {
          setStatus("authenticated");
          return;
        }
        setStatus("unauthenticated");
      } catch (error) {
        console.error("Error checking authentication status:", error);
        setStatus("unauthenticated");
      }
    };
    checkAuth();
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitAuthenticationProvider
          adapter={authenticationAdapter}
          status={status}
        >
          <RainbowKitProvider modalSize="compact" theme={myTheme}>
            {children}
          </RainbowKitProvider>
        </RainbowKitAuthenticationProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
