import { randomBytes, randomInt, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "../../src/prisma/db";

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
const makeJoinCode = (len = 6) =>
  Array.from({ length: len }, () => CODE_CHARS[randomInt(CODE_CHARS.length)]).join("");

export async function createGroupRecord(hostName: string) {
    // 1. Find an unused code (the @unique constraint is the backstop)
  let code = "";
  for (let i = 0; i < 5; i++) {
    const candidate = makeJoinCode();
    const taken = await db.orm.public.Group.where({ password: candidate }).first();
    if (!taken) { code = candidate; break; }
  }
  if (!code) throw new Error("Could not generate a join code");

  // 2. Create group + host together, so you never get a group with no host
  const token = randomBytes(32).toString("base64url");
  const { group } = await db.transaction(async (tx) => {
    const group = await tx.orm.public.Group.create({ password: code });
    await tx.orm.public.Member.create({
      groupId: group.id,
      displayName: hostName,
      isHost: true,
      sessionTokenHash: sha256(token),
    });
    return { group };
  });

  // 3. Raw token goes in the cookie; only its hash is stored
  (await cookies()).set("w2e_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  return { groupId: group.id, joinCode: code, token };

}