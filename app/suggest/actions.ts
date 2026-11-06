"use server";

import { z } from "zod";
import { getMember } from "@/src/prisma/server/session";
import { addCandidateRecord } from "@/src/prisma/server/group";

const suggestionSchema = z.object({
  name: z.string().trim().min(1, "Enter a restaurant name").max(100, "That name is too long"),
  address: z.string().trim().max(200).optional(),
});

// COLLECTING, suggestion mode: a member adds their one restaurant
export async function addSuggestionAction(groupId: string, raw: unknown) {
  const parsed = suggestionSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: "INVALID" as const, message: parsed.error.issues[0]?.message };
  }

  let memberId: string;
  try {
    memberId = (await getMember(groupId)).id;
  } catch {
    return { ok: false as const, error: "NOT_MEMBER" as const };
  }

  return addCandidateRecord(memberId, {
    name: parsed.data.name,
    address: parsed.data.address || undefined,
  });
}