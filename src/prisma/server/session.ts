import { cookies } from "next/headers";
import { db } from "../../prisma/db";
import { sha256 } from "../lib/crypto";

export async function getMember(groupId: string) {
  const token = (await cookies()).get("w2e_session")?.value;
  if (!token) throw new Error("No session");

  const member = await db.orm.public.Member
    .where({ sessionTokenHash: sha256(token), groupId })
    .first();
  if (!member) throw new Error("You're not a member of this group");
  return member;
}

export async function requireHost(groupId: string) {
  const member = await getMember(groupId);
  if (!member?.isHost) throw new Error("Host only");
  return member;
}