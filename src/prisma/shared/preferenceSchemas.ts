import { z } from "zod";

// These are Yelp "category aliases". A wrong alias just returns fewer
// results, but double-check them against Yelp's category list.
export const CUISINES = {
  pizza: "Pizza", italian: "Italian", mexican: "Mexican", tacos: "Tacos",
  chinese: "Chinese", japanese: "Japanese", sushi: "Sushi", ramen: "Ramen",
  thai: "Thai", indpak: "Indian", korean: "Korean", vietnamese: "Vietnamese",
  mediterranean: "Mediterranean", greek: "Greek", french: "French", bbq: "BBQ",
  burgers: "Burgers", sandwiches: "Sandwiches", seafood: "Seafood", steak: "Steak",
  breakfast_brunch: "Breakfast & Brunch", chicken_wings: "Chicken Wings", salad: "Salad",
} as const;
export const CUISINE_OPTIONS = Object.keys(CUISINES) as [keyof typeof CUISINES, ...(keyof typeof CUISINES)[]];

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
