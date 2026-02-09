"use client";

import { useState } from "react";
import { AuctionCard } from "@/components/auction/AuctionCard";
import { auctionItems, categories } from "@/lib/auction/data";
import { SlidersHorizontal } from "lucide-react";

export default function AuctionListPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState<"ending" | "price" | "bids">("ending");

  const filtered =
    activeCategory === "All"
      ? auctionItems
      : auctionItems.filter((item) => item.category === activeCategory);

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "ending")
      return new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime();
    if (sortBy === "price") return b.currentBid - a.currentBid;
    return b.bidCount - a.bidCount;
  });

  return (
    <div>
      {/* Hero section */}
      <div className="px-4 pt-5 pb-4">
        <h1 className="text-2xl font-bold">Live Auctions</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {auctionItems.length} items up for grabs
        </p>
      </div>

      {/* Category pills */}
      <div className="px-4 pb-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Sort bar */}
      <div className="px-4 pb-4 flex items-center gap-2">
        <SlidersHorizontal className="size-3.5 text-muted-foreground" />
        <div className="flex gap-1.5">
          {(
            [
              { key: "ending", label: "Ending soon" },
              { key: "price", label: "Price" },
              { key: "bids", label: "Popular" },
            ] as const
          ).map((option) => (
            <button
              key={option.key}
              onClick={() => setSortBy(option.key)}
              className={`text-[11px] px-2.5 py-1 rounded-md transition-all ${
                sortBy === option.key
                  ? "bg-foreground text-background font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Auction grid */}
      <div className="px-4 pb-6 grid grid-cols-2 gap-3">
        {sorted.map((item) => (
          <AuctionCard key={item.id} item={item} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">No auctions in this category</p>
        </div>
      )}
    </div>
  );
}
