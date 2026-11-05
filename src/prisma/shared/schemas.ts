import { z } from "zod";

// The rules for joining a group.
export const joinGroupSchema = z.object({
  inviteCode: z.string().trim().toUpperCase().length(6, "Invite codes are 6 characters"),
  displayName: z.string().trim().min(1, "Name is required").max(30, "Name is too long"),
});

export type JoinGroupInput = z.infer<typeof joinGroupSchema>;

export const configureGroupSchema = z
  .object({
    model: z.enum(["SUGGESTION", "PREFERENCE"]),
    decisionType: z.enum(["VOTE", "RANDOM", "BEST_FIT"]),
    location: z.string().trim().max(100).optional(),
  })
  .refine((d) => !(d.decisionType === "BEST_FIT" && d.model !== "PREFERENCE"), {
    message: "Best fit is only available with preferences",
    path: ["decisionType"],
  })
  .refine((d) => d.model !== "PREFERENCE" || !!d.location, {
    message: "Location is required for preference mode",
    path: ["location"],
  });