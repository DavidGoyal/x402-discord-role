"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { FaWallet } from "react-icons/fa";

const WalletButton = () => {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        // Note: If your app doesn't use authentication, you
        // can remove all 'authenticationStatus' checks
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
                height: "full",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <div className="flex items-center gap-4 h-full">
                    <button
                      onClick={openConnectModal}
                      type="button"
                      className="h-9 px-4 border border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground font-medium rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <span className="hidden sm:block">Connect Wallet</span>
                      <FaWallet className="sm:hidden h-4 w-4" />
                    </button>
                  </div>
                );
              }
              if (chain.unsupported) {
                return (
                  <div className="flex items-center gap-4 h-full">
                    <button
                      onClick={openChainModal}
                      type="button"
                      className="h-9 px-4 border border-destructive bg-card text-destructive hover:bg-destructive/10 font-medium rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <span className="hidden sm:block">Wrong network</span>
                      <FaWallet className="sm:hidden h-4 w-4" />
                    </button>
                  </div>
                );
              }
              return (
                <div className="flex flex-col items-start gap-2 h-full relative">
                  <button
                    className="h-9 px-4 border border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground font-medium rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onClick={openAccountModal}
                  >
                    <span className="hidden sm:block font-mono">
                      {account.address.slice(0, 4)}...
                      {account.address.slice(-4)}
                    </span>
                    <FaWallet className="sm:hidden h-4 w-4" />
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};

export default WalletButton;
