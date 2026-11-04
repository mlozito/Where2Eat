"use server";

// status control
import { z } from "zod";
import { cookies } from "next/headers";
import { joinGroupRecord } from "../../src/prisma/server/group";
import { getMember } from "@/src/prisma/server/session";
import {
  configureGroupRecord, startDecisionRecord, castVoteRecord,
  closeRoundRecord, resolveTieRecord, getRoundSummaryRecord,
} from "@/src/prisma/server/group";


const Join = z.object({
  joinCode: z.string().trim().toUpperCase().length(6),
  displayName: z.string().trim().min(1).max(40),
});

export async function joinGroup(input: unknown) {
  const parsed = Join.safeParse(input);
  if (!parsed.success) return { error: "Check the code and your name." };

  const result = await joinGroupRecord(parsed.data.joinCode, parsed.data.displayName);
  if (!result.ok) {
    return { error: result.error === "NAME_TAKEN"
      ? "That name is already taken in this group."
      : "Couldn't join with that code." };
  }

  (await cookies()).set("w2e_session", result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return { groupId: result.groupId };
}

export async function configureGroup(groupId: string, input: {
  model: "SUGGESTION" | "PREFERENCE";
  decisionType: "VOTE" | "RANDOM" | "BEST_FIT";
  location?: string;
}) {
  const member = await getMember(groupId);
  return configureGroupRecord(member.id, input);
}

export async function startDecision(groupId: string) {
  const member = await getMember(groupId);
  return startDecisionRecord(member.id);
}

export async function castVote(groupId: string, candidateId: string) {
  const member = await getMember(groupId);
  return castVoteRecord(member.id, candidateId);
}

export async function closeRound(groupId: string) {
  const member = await getMember(groupId);
  return closeRoundRecord(member.id);
}

export async function resolveTie(groupId: string, choice: "REVOTE" | "RANDOM") {
  const member = await getMember(groupId);
  return resolveTieRecord(member.id, choice);
}

export async function getRoundSummary(groupId: string) {
  const member = await getMember(groupId);
  return getRoundSummaryRecord(member.id);
}