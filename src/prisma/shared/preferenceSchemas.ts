import { z } from "zod";

// These are Yelp "category aliases". A wrong alias just returns fewer
// results, but double-check them against Yelp's category list.
export const CUISINE_OPTIONS = [
  "Pizza", "Italian", "Mexican", "Tacos", "Chinese", "Japanese", "Sushi",
  "Ramen", "Thai", "Indian", "Korean", "Vietnamese", "Mediterranean",
  "Greek", "French", "BBQ", "Burgers", "Sandwiches", "Seafood", "Steak",
  "Breakfast Brunch", "Chicken Wings", "Salad",
] as const;

export const DIETARY_OPTIONS = ["Vegetarian", "Vegan", "Gluten free", "Dairy free", "Kosher", "Seafood", "Shellfish"] as const;

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