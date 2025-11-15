"use client";

import { FaXTwitter, FaDiscord } from "react-icons/fa6";

export default function Footer() {
  const handleExternalLink = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <footer className="mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-row items-center justify-center gap-4">
          <button
            onClick={() => handleExternalLink("https://twitter.com")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <FaXTwitter className="h-4 w-4" />
            <span className="hidden sm:inline">Twitter</span>
          </button>
          <button
            onClick={() => handleExternalLink("https://discord.com")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <FaDiscord className="h-4 w-4" />
            <span className="hidden sm:inline">Discord</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
