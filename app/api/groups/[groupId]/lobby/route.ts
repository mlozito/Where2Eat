import { NextResponse } from "next/server";
import { route } from "@/src/prisma/lib/api";
import { getMember } from "@/src/prisma/server/session";
import { getLobby } from "@/src/prisma/server/services/lobby";

type Context = { params: Promise<{ groupId: string }> };

export const GET = route<Context>(async (_request, { params }) => {
  const { groupId } = await params;
  const member = await getMember(groupId);
  const lobby = await getLobby(groupId, member.id);
  return NextResponse.json(lobby, { headers: { "Cache-Control": "no-store" } });
});