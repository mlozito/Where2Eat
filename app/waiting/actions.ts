"use server";

import { getGroupAndMembersByToken, findMemberByToken, configureGroupRecord } from "../../src/prisma/server/group";
import { cookies } from "next/headers";

//Get the current members group
export async function getCurrentGroupAndMembers() {
  const cookieStore = await cookies();
  const token = cookieStore.get("w2e_session")?.value;
  if (!token) {
    return { ok: false as const, error: "NOT_FOUND" as const };
  }

  return await getGroupAndMembersByToken(token);
}

//Puts together the group mode
export async function configureGroup(input: {
  model: "SUGGESTION" | "PREFERENCE";
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("w2e_session")?.value;

  if (!token) {
    return { ok: false as const, error: "NOT_FOUND" as const };
  }

  const member = await findMemberByToken(token);

  if (!member) {
    return { ok: false as const, error: "NOT_FOUND" as const };
  }

  return await configureGroupRecord(member.id, {
    model: input.model,
    decisionType: "VOTE",
  });
}
