import Link from "next/link";
import WalletButton from "@/components/wallet-button";

export default function Header() {
  return (
    <header className="border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl sm:text-2xl font-bold">
            402x
          </Link>
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
