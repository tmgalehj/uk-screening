import type { Metadata } from "next";
import Link from "next/link";
import { Gavel, Search, Heart, User } from "lucide-react";

export const metadata: Metadata = {
  title: "BidUp - Mobile Auctions",
  description: "Simple mobile auction app",
};

function BottomNav() {
  const navItems = [
    { href: "/auction", icon: Gavel, label: "Auctions" },
    { href: "/auction?q=search", icon: Search, label: "Search" },
    { href: "/auction?tab=watchlist", icon: Heart, label: "Watchlist" },
    { href: "/auction?tab=profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex flex-col items-center gap-1 px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <item.icon className="size-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default function AuctionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background max-w-lg mx-auto relative">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center justify-between h-14 px-4">
          <Link href="/auction" className="flex items-center gap-2">
            <Gavel className="size-5 text-primary" />
            <span className="font-bold text-lg tracking-tight">BidUp</span>
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="bg-emerald-100 text-emerald-700 text-[11px] font-medium px-2 py-0.5 rounded-full">
              Live
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="pb-20">{children}</main>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
}
