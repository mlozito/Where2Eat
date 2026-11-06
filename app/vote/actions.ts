"use server";

import { getMember } from "@/src/prisma/server/session";
import { castVoteRecord } from "@/src/prisma/server/group";

// DECIDING: a member casts their one anonymous vote for this round
export async function castVoteAction(groupId: string, candidateId: unknown) {
  if (typeof candidateId !== "string" || !candidateId) {
    return { ok: false as const, error: "INVALID" as const };
  }

  let memberId: string;
  try {
    memberId = (await getMember(groupId)).id;
  } catch {
    return { ok: false as const, error: "NOT_MEMBER" as const };
  }

  return castVoteRecord(memberId, candidateId);
}