import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CountdownTimer } from "./CountdownTimer";
import type { AuctionItem } from "@/lib/auction/data";
import { Gavel, Eye } from "lucide-react";

interface AuctionCardProps {
  item: AuctionItem;
}

const categoryColors: Record<string, string> = {
  Electronics: "bg-blue-100 text-blue-800",
  Fashion: "bg-pink-100 text-pink-800",
  Music: "bg-purple-100 text-purple-800",
  Books: "bg-amber-100 text-amber-800",
  Watches: "bg-emerald-100 text-emerald-800",
  Gaming: "bg-red-100 text-red-800",
  Furniture: "bg-orange-100 text-orange-800",
};

export function AuctionCard({ item }: AuctionCardProps) {
  return (
    <Link href={`/auction/${item.id}`}>
      <div className="bg-card border rounded-xl overflow-hidden shadow-sm active:scale-[0.98] transition-transform">
        {/* Image placeholder */}
        <div className="h-40 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
          <Gavel className="size-10 text-muted-foreground/40" />
        </div>

        <div className="p-4 space-y-3">
          {/* Category + condition */}
          <div className="flex items-center gap-2">
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${categoryColors[item.category] ?? "bg-muted text-muted-foreground"}`}
            >
              {item.category}
            </span>
            <Badge variant="outline" className="text-[11px]">
              {item.condition}
            </Badge>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-sm leading-tight line-clamp-2">
            {item.title}
          </h3>

          {/* Price + bids */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[11px] text-muted-foreground">Current bid</p>
              <p className="text-lg font-bold">
                £{item.currentBid.toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Eye className="size-3.5" />
              <span className="text-xs">{item.bidCount} bids</span>
            </div>
          </div>

          {/* Timer */}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-[11px] text-muted-foreground">Ends in</span>
            <CountdownTimer endsAt={item.endsAt} compact />
          </div>
        </div>
      </div>
    </Link>
  );
}
