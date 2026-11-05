import { cookies } from "next/headers";
import { db } from "../../prisma/db";
import { sha256 } from "../lib/crypto";
import { ForbiddenError, UnauthorizedError } from "../lib/errors";

export async function getMember(groupId: string) {
  const token = (await cookies()).get("w2e_session")?.value;
  if (!token) throw new UnauthorizedError("No session");

  const member = await db.orm.public.Member
    .where({ sessionTokenHash: sha256(token), groupId })
    .first();
  if (!member) throw new UnauthorizedError("You're not a member of this group");
  return member;
}

export async function requireHost(groupId: string) {
  const member = await getMember(groupId);
  if (!member?.isHost) throw new ForbiddenError("Host only");
  return member;
}