"use server";

import { getMember } from "@/src/prisma/server/session";
import { configureGroupRecord } from "@/src/prisma/server/group";
import { configureGroupSchema } from "@/src/prisma/shared/schemas";

export async function configureGroupAction(groupId: string, raw: unknown) {
  const parsed = configureGroupSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "INVALID" as const,
      message: parsed.error.issues[0]?.message,
    };
  }

  let memberId: string;
  try {
    memberId = (await getMember(groupId)).id;
  } catch {
    return { ok: false as const, error: "NOT_MEMBER" as const };
  }

  return await configureGroupRecord(memberId, parsed.data);
}