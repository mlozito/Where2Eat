import { randomBytes, randomInt, createHash } from "node:crypto";
import { db } from "../../prisma/db";

"use server";

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
export const CODE_LENGTH = 6;

const makeInviteCode = () =>
  Array.from({ length: CODE_LENGTH }, () => CODE_CHARS[randomInt(CODE_CHARS.length)]).join("");

const normalizeCode = (s: string) => s.trim().toUpperCase();

const newToken = () => randomBytes(32).toString("base64url");

export async function createGroupRecord(hostName: string) {
  // Find an unused code (the @unique constraint is the backstop)
  let inviteCode = "";
  for (let i = 0; i < 5; i++) {
    const candidate = makeInviteCode();
    const taken = await db.orm.public.Group.where({ inviteCode: candidate }).first();
    if (!taken) { inviteCode = candidate; break; }
  }
  if (!inviteCode) throw new Error("Could not generate an invite code");

  // Group + host together, so you never get a group with no host
  const token = newToken();
  const group = await db.transaction(async (tx) => {
    const group = await tx.orm.public.Group.create({ inviteCode });
    await tx.orm.public.Member.create({
      groupId: group.id,
      displayName: hostName,
      isHost: true,
      sessionTokenHash: sha256(token),
    });
    return group;
  });

  return { groupId: group.id, inviteCode, token };
}

export async function joinGroupRecord(rawInviteCode: string, displayName: string) {
  const inviteCode = normalizeCode(rawInviteCode);

  const group = await db.orm.public.Group.where({ inviteCode }).first();
  if (!group || group.status === "COMPLETE") {
    return { ok: false as const, error: "NOT_FOUND" as const };
  }

  const taken = await db.orm.public.Member
    .where({ groupId: group.id, displayName }).first();
  if (taken) return { ok: false as const, error: "NAME_TAKEN" as const };

  const token = newToken();
  await db.orm.public.Member.create({
    groupId: group.id,
    displayName,
    sessionTokenHash: sha256(token),
  });
  return { ok: true as const, groupId: group.id, token };
}

// Used by the session helper later, and testable without Next.js
export async function findMemberByToken(token: string) {
  return db.orm.public.Member.where({ sessionTokenHash: sha256(token) }).first();
}