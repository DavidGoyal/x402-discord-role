import Link from "next/link";
import { FaXTwitter, FaDiscord } from "react-icons/fa6";

export default function Footer() {
  return (
    <footer>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-row items-center justify-center gap-4">
          <Link
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <FaXTwitter className="h-4 w-4" />
            <span className="hidden sm:inline">Twitter</span>
          </Link>
          <Link
            href="https://discord.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <FaDiscord className="h-4 w-4" />
            <span className="hidden sm:inline">Discord</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
