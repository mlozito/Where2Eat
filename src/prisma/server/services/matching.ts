import type { RestaurantSnapshot } from "../../shared/restaurant";

export type MemberPreference = {
  cuisines: string[];
  dietaryRestrictions: string[];
  priceLevels: number[];
  maxDistanceMeters: number | null;
};

// ---- Tuning knobs: change these to change the behavior ----
export const DEFAULT_RADIUS_METERS = 8000;
const FIT_WEIGHT = 0.7; // how much "does it match what people want" matters
const QUALITY_WEIGHT = 0.3; // how much "is it actually a good restaurant" matters
const MEAN_WEIGHT = 0.6; // within "fit": the group average...
const MIN_WEIGHT = 0.4; // ...and the least-happy member (fairness)
const CUISINE_WEIGHT = 0.7; // within one person's happiness: cuisine...
const PRICE_WEIGHT = 0.3; // ...and price
const DIETARY_BOOST = 0.15;
const MAX_PER_CATEGORY = 2;
const PRIOR_RATING = 3.8;
const PRIOR_WEIGHT = 50;

// Turn everyone's preferences into one Yelp search.
export function buildSearchQuery(prefs: MemberPreference[]) {
  const categories = new Set<string>();
  for (const p of prefs) {
    p.cuisines.forEach((c) => categories.add(c));
    p.dietaryRestrictions.forEach((d) => categories.add(d));
  }
  if (categories.size === 0) categories.add("restaurants");

  // Respect the shortest distance anyone is willing to travel.
  const distances = prefs
    .map((p) => p.maxDistanceMeters)
    .filter((d): d is number => d !== null);
  const radiusMeters = distances.length ? Math.min(...distances) : DEFAULT_RADIUS_METERS;

  return { categories: [...categories], radiusMeters };
}

// How happy would this one person be with this restaurant? (0 to 1)
function memberSatisfaction(p: MemberPreference, r: RestaurantSnapshot): number {
  const aliases = new Set(r.categories.map((c) => c.alias));

  const cuisine =
    p.cuisines.length === 0 ? 1 : p.cuisines.some((c) => aliases.has(c)) ? 1 : 0;

  const price =
    p.priceLevels.length === 0
      ? 1
      : r.priceLevel == null
        ? 0.5 // unknown price: neither good nor bad
        : p.priceLevels.includes(r.priceLevel)
          ? 1
          : 0;

  return CUISINE_WEIGHT * cuisine + PRICE_WEIGHT * price;
}

// A rating adjusted for how many reviews back it up (0 to 1).
function quality(r: RestaurantSnapshot): number {
  const rating = r.rating ?? 0;
  const votes = r.reviewCount ?? 0;
  const adjusted = (votes * rating + PRIOR_WEIGHT * PRIOR_RATING) / (votes + PRIOR_WEIGHT);
  return adjusted / 5;
}

export function scoreRestaurant(r: RestaurantSnapshot, prefs: MemberPreference[]): number {
  const satisfactions = prefs.map((p) => memberSatisfaction(p, r));
  const mean = satisfactions.length
    ? satisfactions.reduce((a, b) => a + b, 0) / satisfactions.length
    : 1;
  const least = satisfactions.length ? Math.min(...satisfactions) : 1;
  const fit = MEAN_WEIGHT * mean + MIN_WEIGHT * least;

  // Dietary needs: a boost for restaurants tagged to match.
  const needs = [...new Set(prefs.flatMap((p) => p.dietaryRestrictions))];
  const aliases = new Set(r.categories.map((c) => c.alias));
  const dietary = needs.length
    ? DIETARY_BOOST * (needs.filter((n) => aliases.has(n)).length / needs.length)
    : 0;

  return FIT_WEIGHT * fit + QUALITY_WEIGHT * quality(r) + dietary;
}

export type ScoredRestaurant = { restaurant: RestaurantSnapshot; score: number };

// Score everything, then pick the top N with some variety.
export function pickTopRestaurants(
  candidates: RestaurantSnapshot[],
  prefs: MemberPreference[],
  count = 6,
): ScoredRestaurant[] {
  const seen = new Set<string>();
  const scored: ScoredRestaurant[] = [];

  for (const r of candidates) {
    if (r.isClosed) continue; // permanently closed
    const key = r.yelpId ?? r.name;
    if (seen.has(key)) continue; // no duplicates
    seen.add(key);
    scored.push({ restaurant: r, score: scoreRestaurant(r, prefs) });
  }

  // Highest score first; ties broken the same way every time.
  scored.sort(
    (a, b) =>
      b.score - a.score ||
      (b.restaurant.rating ?? 0) - (a.restaurant.rating ?? 0) ||
      (b.restaurant.reviewCount ?? 0) - (a.restaurant.reviewCount ?? 0) ||
      a.restaurant.name.localeCompare(b.restaurant.name),
  );

  // Variety: at most MAX_PER_CATEGORY from the same main cuisine.
  const picked: ScoredRestaurant[] = [];
  const skipped: ScoredRestaurant[] = [];
  const perCategory = new Map<string, number>();

  for (const item of scored) {
    const main = item.restaurant.categories[0]?.alias ?? "other";
    const used = perCategory.get(main) ?? 0;
    if (used < MAX_PER_CATEGORY && picked.length < count) {
      picked.push(item);
      perCategory.set(main, used + 1);
    } else {
      skipped.push(item);
    }
  }
  // If variety left us short, fill from the best of what was skipped.
  for (const item of skipped) {
    if (picked.length >= count) break;
    picked.push(item);
  }
  return picked;
}