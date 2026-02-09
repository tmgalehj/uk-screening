"use client";

import { use } from "react";
import Link from "next/link";
import { getAuction, getBids } from "@/lib/auction/data";
import { CountdownTimer } from "@/components/auction/CountdownTimer";
import { BidForm } from "@/components/auction/BidForm";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Heart,
  Share2,
  Gavel,
  ShieldCheck,
  Truck,
  User,
} from "lucide-react";

export default function AuctionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const item = getAuction(id);
  const bids = getBids(id);

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <Gavel className="size-12 text-muted-foreground/30 mb-4" />
        <h2 className="font-semibold text-lg">Auction not found</h2>
        <p className="text-sm text-muted-foreground mt-1">
          This listing may have been removed
        </p>
        <Link
          href="/auction"
          className="mt-4 text-sm text-primary font-medium"
        >
          Back to auctions
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <Link
          href="/auction"
          className="flex items-center gap-1.5 text-sm text-muted-foreground"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>
        <div className="flex items-center gap-3">
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <Share2 className="size-4" />
          </button>
          <button className="text-muted-foreground hover:text-red-500 transition-colors">
            <Heart className="size-4" />
          </button>
        </div>
      </div>

      {/* Image */}
      <div className="h-56 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mx-4 rounded-xl">
        <Gavel className="size-16 text-muted-foreground/30" />
      </div>

      {/* Content */}
      <div className="px-4 pt-4 space-y-5">
        {/* Category + condition */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{item.category}</Badge>
          <Badge variant="outline">{item.condition}</Badge>
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold leading-tight">{item.title}</h1>

        {/* Price + timer card */}
        <div className="bg-muted/50 rounded-xl p-4 space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Current bid</p>
              <p className="text-2xl font-bold">
                £{item.currentBid.toLocaleString()}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {item.bidCount} bids &middot; Started at £
                {item.startingPrice.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-1">Time left</p>
              <CountdownTimer endsAt={item.endsAt} />
            </div>
          </div>
        </div>

        {/* Bid form */}
        <div className="border rounded-xl p-4">
          <h2 className="font-semibold text-sm mb-3">Place your bid</h2>
          <BidForm currentBid={item.currentBid} auctionId={item.id} />
        </div>

        {/* Description */}
        <div>
          <h2 className="font-semibold text-sm mb-2">Description</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Seller info */}
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
          <div className="size-10 rounded-full bg-muted flex items-center justify-center">
            <User className="size-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{item.seller}</p>
            <p className="text-[11px] text-muted-foreground">Verified seller</p>
          </div>
          <ShieldCheck className="size-4 text-emerald-600" />
        </div>

        {/* Trust badges */}
        <div className="grid grid-cols-2 gap-2 pb-2">
          <div className="flex items-center gap-2 p-3 border rounded-lg">
            <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
            <span className="text-xs text-muted-foreground">
              Buyer protection
            </span>
          </div>
          <div className="flex items-center gap-2 p-3 border rounded-lg">
            <Truck className="size-4 text-blue-600 shrink-0" />
            <span className="text-xs text-muted-foreground">
              Tracked delivery
            </span>
          </div>
        </div>

        {/* Bid history */}
        {bids.length > 0 && (
          <div className="pb-4">
            <h2 className="font-semibold text-sm mb-3">Recent bids</h2>
            <div className="space-y-2">
              {bids.map((bid, i) => (
                <div
                  key={bid.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-[10px] font-medium">
                        {bid.bidder[0]}
                      </span>
                    </div>
                    <span className="text-sm">{bid.bidder}</span>
                    {i === 0 && (
                      <Badge
                        variant="default"
                        className="text-[10px] px-1.5 py-0"
                      >
                        Leading
                      </Badge>
                    )}
                  </div>
                  <span className="font-semibold text-sm">
                    £{bid.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
