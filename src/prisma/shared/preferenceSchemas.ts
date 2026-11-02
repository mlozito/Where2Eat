import { z } from "zod";

// These are Yelp "category aliases". A wrong alias just returns fewer
// results, but double-check them against Yelp's category list.
export const CUISINE_OPTIONS = [
  "pizza", "italian", "mexican", "tacos", "chinese", "japanese", "sushi",
  "ramen", "thai", "indian", "korean", "vietnamese", "mediterranean",
  "greek", "french", "bbq", "burgers", "sandwiches", "seafood", "steak",
  "breakfast_brunch", "chicken_wings", "salad",
] as const;

export const DIETARY_OPTIONS = ["vegetarian", "vegan", "gluten_free", "dairy_free", "kosher", "seafood", "shellfish"] as const;

export const preferenceSchema = z.object({
  cuisines: z.array(z.enum(CUISINE_OPTIONS)).max(5).optional(),
  dietaryRestrictions: z.array(z.enum(DIETARY_OPTIONS)).max(7).optional(),
  maxPriceLevel: z.number().int().min(1).max(4).nullable().optional(),
  maxDistanceMeters: z.number().int().min(500).max(40000).nullable().optional(),
});

export type PreferenceInput = z.infer<typeof preferenceSchema>;

export const locationSchema = z.object({
  location: z.string().trim().min(2, "Location is required").max(100),
});