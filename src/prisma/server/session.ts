import { cookies } from "next/headers";
import { db } from "../../prisma/db";
import { sha256 } from "./group";

export async function getMember() {
  const token = (await cookies()).get("w2e_session")?.value;
  if (!token) return null;
  return db.orm.public.Member.where({ sessionTokenHash: sha256(token) }).first();
}

export async function requireHost() {
  const member = await getMember();
  if (!member?.isHost) throw new Error("Host only");
  return member;
}