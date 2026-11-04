"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { createGroupRecord } from "../../src/prisma/server/group";
import { error } from "console";

const Create = z.object({
  displayName: z.string().trim().min(1).max(40),
});

export async function createGroup(input: unknown) {
  const parsed = Create.safeParse(input);

  if (!parsed.success) {
    return { error: "Enter your name." };
  }

  try {
    const result = await createGroupRecord(parsed.data.displayName);

    (await cookies()).set("w2e_session", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return {
      groupId: result.groupId,
      inviteCode: result.inviteCode,
    };
  } catch (error) {
    console.error("Failed to create group", error);
    return { error: "Couldn't create your group. Please try again." };
  }
}