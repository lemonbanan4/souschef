/** Chef Gino's friendship meter — unlocks cosmetic outfits as it grows. */

export type GinoOutfit = "classic" | "shades" | "medal" | "legend";

export interface FriendshipTier {
  min: number;
  name: string;
  outfit: GinoOutfit;
}

export const FRIENDSHIP_TIERS: FriendshipTier[] = [
  { min: 0, name: "New Friend", outfit: "classic" },
  { min: 30, name: "Kitchen Buddy", outfit: "shades" },
  { min: 80, name: "Amico di Cucina", outfit: "medal" },
  { min: 150, name: "Famiglia", outfit: "legend" },
];

export const FRIENDSHIP_MAX = 150;

export function friendshipTier(points: number): FriendshipTier {
  let tier = FRIENDSHIP_TIERS[0];
  for (const t of FRIENDSHIP_TIERS) if (points >= t.min) tier = t;
  return tier;
}

export function nextFriendshipTier(points: number): FriendshipTier | null {
  return FRIENDSHIP_TIERS.find((t) => t.min > points) ?? null;
}
