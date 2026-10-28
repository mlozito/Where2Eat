import { z } from "zod";

// The rules for joining a group.
export const joinGroupSchema = z.object({
  inviteCode: z.string().trim().toUpperCase().length(6, "Invite codes are 6 characters"),
  displayName: z.string().trim().min(1, "Name is required").max(30, "Name is too long"),
});

export type JoinGroupInput = z.infer<typeof joinGroupSchema>;