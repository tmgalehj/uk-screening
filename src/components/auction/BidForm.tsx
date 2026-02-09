"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BidFormProps {
  currentBid: number;
  auctionId: string;
}

export function BidForm({ currentBid, auctionId }: BidFormProps) {
  const minBid = currentBid + 10;
  const [amount, setAmount] = useState(minBid.toString());
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < minBid) {
      setError(`Minimum bid is £${minBid}`);
      return;
    }

    // Mock submission
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  }

  const quickBids = [
    { label: `+£10`, value: currentBid + 10 },
    { label: `+£25`, value: currentBid + 25 },
    { label: `+£50`, value: currentBid + 50 },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Quick bid buttons */}
      <div className="flex gap-2">
        {quickBids.map((qb) => (
          <button
            key={qb.value}
            type="button"
            onClick={() => setAmount(qb.value.toString())}
            className="flex-1 py-2 text-xs font-medium rounded-lg border bg-muted/50 hover:bg-muted active:scale-95 transition-all"
          >
            {qb.label}
            <span className="block text-[10px] text-muted-foreground">
              £{qb.value.toLocaleString()}
            </span>
          </button>
        ))}
      </div>

      {/* Custom amount */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            £
          </span>
          <Input
            type="number"
            min={minBid}
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-7 text-base"
            placeholder={`Min £${minBid}`}
            aria-label={`Bid amount for auction ${auctionId}`}
          />
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={submitted}
          className="px-6 font-semibold"
        >
          {submitted ? "Bid placed!" : "Place Bid"}
        </Button>
      </div>

      {error && <p className="text-destructive text-xs">{error}</p>}
      {submitted && (
        <p className="text-emerald-600 text-xs font-medium">
          Your bid of £{parseFloat(amount).toLocaleString()} has been placed!
        </p>
      )}
      <p className="text-[11px] text-muted-foreground">
        Min. increment: £10 &middot; Bids are binding
      </p>
    </form>
  );
}
