import { describe, expect, it } from "vitest";
import type { RestaurantSnapshot } from "../../shared/restaurant";
import { buildSearchQuery, pickTopRestaurants, type MemberPreference } from "./matching";

const pref = (o: Partial<MemberPreference> = {}): MemberPreference => ({
  cuisines: [], dietaryRestrictions: [], priceLevels: [], maxDistanceMeters: null, ...o,
});

const place = (name: string, alias: string, o: Partial<RestaurantSnapshot> = {}): RestaurantSnapshot => ({
  yelpId: name, name, rating: 4.2, reviewCount: 200, priceLevel: 2,
  categories: [{ alias, title: alias }], ...o,
});

describe("buildSearchQuery", () => {
  it("uses the smallest distance anyone allows", () => {
    const q = buildSearchQuery([pref({ maxDistanceMeters: 5000 }), pref({ maxDistanceMeters: 2000 }), pref()]);
    expect(q.radiusMeters).toBe(2000);
  });
  it("falls back to generic restaurants when nobody chose a cuisine", () => {
    expect(buildSearchQuery([pref()]).categories).toEqual(["restaurants"]);
  });
});

describe("pickTopRestaurants", () => {
  it("prefers the place everyone is OK with over one loved by half the group", () => {
    const prefs = [pref({ cuisines: ["thai", "pizza"] }), pref({ cuisines: ["pizza"] })];
    const result = pickTopRestaurants([place("Thai Only", "thai"), place("Pizza Spot", "pizza")], prefs);
    expect(result[0].restaurant.name).toBe("Pizza Spot");
  });
  it("ranks a vegetarian-tagged place higher when someone needs it", () => {
    const prefs = [pref({ dietaryRestrictions: ["vegetarian"] })];
    const result = pickTopRestaurants([place("Steakhouse", "steak"), place("Green Place", "vegetarian")], prefs);
    expect(result[0].restaurant.name).toBe("Green Place");
  });
  it("does not let one cuisine fill the whole list", () => {
    const many = Array.from({ length: 8 }, (_, i) => place(`Pizza ${i}`, "pizza"));
    const result = pickTopRestaurants([...many, place("Thai A", "thai"), place("Thai B", "thai")], [pref()], 4);
    const pizzas = result.filter((r) => r.restaurant.categories[0].alias === "pizza");
    expect(pizzas.length).toBeLessThanOrEqual(2);
  });
  it("skips closed restaurants", () => {
    const result = pickTopRestaurants([place("Gone", "pizza", { isClosed: true }), place("Open", "pizza")], [pref()]);
    expect(result.map((r) => r.restaurant.name)).toEqual(["Open"]);
  });
});