"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { joinGroupRecord } from "../../src/prisma/server/group"; // adjust ../ depth

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