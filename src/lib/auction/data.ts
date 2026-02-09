export interface AuctionItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  currentBid: number;
  startingPrice: number;
  bidCount: number;
  endsAt: string; // ISO date
  seller: string;
  category: string;
  condition: "New" | "Like New" | "Good" | "Fair";
}

export interface Bid {
  id: string;
  auctionId: string;
  bidder: string;
  amount: number;
  timestamp: string;
}

// Auction ends at various future times relative to now
function hoursFromNow(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

export const auctionItems: AuctionItem[] = [
  {
    id: "1",
    title: "Vintage Polaroid SX-70 Camera",
    description:
      "Original 1972 Polaroid SX-70 Land Camera in excellent working condition. Comes with leather case and 2 packs of film. A true collector's piece with beautiful patina.",
    imageUrl: "",
    currentBid: 245,
    startingPrice: 100,
    bidCount: 12,
    endsAt: hoursFromNow(2.5),
    seller: "RetroFinds",
    category: "Electronics",
    condition: "Good",
  },
  {
    id: "2",
    title: "Air Jordan 1 Retro High OG",
    description:
      'Brand new, deadstock Air Jordan 1 Retro High OG "Chicago" colorway. Size UK 9. Comes with original box and extra laces. Never worn.',
    imageUrl: "",
    currentBid: 380,
    startingPrice: 200,
    bidCount: 24,
    endsAt: hoursFromNow(0.5),
    seller: "SneakerVault",
    category: "Fashion",
    condition: "New",
  },
  {
    id: "3",
    title: "Gibson Les Paul Standard '50s",
    description:
      "2023 Gibson Les Paul Standard '50s in Heritage Cherry Sunburst. Includes original hardshell case. Played gently at home only, mint condition.",
    imageUrl: "",
    currentBid: 1850,
    startingPrice: 1500,
    bidCount: 8,
    endsAt: hoursFromNow(18),
    seller: "GuitarCollector",
    category: "Music",
    condition: "Like New",
  },
  {
    id: "4",
    title: "First Edition Harry Potter",
    description:
      "Harry Potter and the Philosopher's Stone, first UK edition, second print. Very good condition with minor shelf wear. Dust jacket intact.",
    imageUrl: "",
    currentBid: 4200,
    startingPrice: 3000,
    bidCount: 15,
    endsAt: hoursFromNow(6),
    seller: "RareBooks_UK",
    category: "Books",
    condition: "Good",
  },
  {
    id: "5",
    title: "MacBook Pro M3 Max 16\"",
    description:
      "Apple MacBook Pro 16-inch with M3 Max chip, 36GB RAM, 1TB SSD. Space Black. AppleCare+ until 2027. Includes original box and charger.",
    imageUrl: "",
    currentBid: 2100,
    startingPrice: 1800,
    bidCount: 19,
    endsAt: hoursFromNow(4),
    seller: "TechDeals",
    category: "Electronics",
    condition: "Like New",
  },
  {
    id: "6",
    title: "Omega Speedmaster Moonwatch",
    description:
      "Omega Speedmaster Professional Moonwatch Co-Axial. Reference 310.30.42.50.01.002. Full set with box, papers, and warranty card dated 2024.",
    imageUrl: "",
    currentBid: 4750,
    startingPrice: 4000,
    bidCount: 11,
    endsAt: hoursFromNow(36),
    seller: "WatchEnthusiast",
    category: "Watches",
    condition: "Like New",
  },
  {
    id: "7",
    title: "Nintendo Switch OLED + Games Bundle",
    description:
      "Nintendo Switch OLED model (white) with 8 top games including Zelda TOTK, Mario Odyssey, and more. Includes Pro Controller and carry case.",
    imageUrl: "",
    currentBid: 310,
    startingPrice: 250,
    bidCount: 7,
    endsAt: hoursFromNow(1),
    seller: "GameStation",
    category: "Gaming",
    condition: "Good",
  },
  {
    id: "8",
    title: "Herman Miller Aeron Chair",
    description:
      "Herman Miller Aeron Size B, fully loaded with all adjustments. Remastered 2023 model in Graphite. PostureFit SL included.",
    imageUrl: "",
    currentBid: 680,
    startingPrice: 500,
    bidCount: 14,
    endsAt: hoursFromNow(10),
    seller: "OfficePro",
    category: "Furniture",
    condition: "Like New",
  },
];

export const bidHistory: Record<string, Bid[]> = {
  "1": [
    { id: "b1", auctionId: "1", bidder: "PhotoFan22", amount: 245, timestamp: hoursFromNow(-0.5) },
    { id: "b2", auctionId: "1", bidder: "VintageHunter", amount: 220, timestamp: hoursFromNow(-2) },
    { id: "b3", auctionId: "1", bidder: "PhotoFan22", amount: 180, timestamp: hoursFromNow(-5) },
    { id: "b4", auctionId: "1", bidder: "CollectorJane", amount: 150, timestamp: hoursFromNow(-8) },
  ],
  "2": [
    { id: "b5", auctionId: "2", bidder: "KicksKing", amount: 380, timestamp: hoursFromNow(-0.2) },
    { id: "b6", auctionId: "2", bidder: "SneakerHead99", amount: 350, timestamp: hoursFromNow(-1) },
    { id: "b7", auctionId: "2", bidder: "KicksKing", amount: 320, timestamp: hoursFromNow(-3) },
  ],
};

export function getAuction(id: string): AuctionItem | undefined {
  return auctionItems.find((item) => item.id === id);
}

export function getBids(auctionId: string): Bid[] {
  return bidHistory[auctionId] ?? [];
}

export const categories = [
  "All",
  "Electronics",
  "Fashion",
  "Music",
  "Books",
  "Watches",
  "Gaming",
  "Furniture",
];
