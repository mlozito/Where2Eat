import { NextResponse } from "next/server";
import { requireHost } from "@/src/prisma/server/session";
import { route } from "@/src/prisma/lib/api";
import { generateCandidates } from "@/src/prisma/server/services/candidates";

type Context = { params: Promise<{ groupId: string }> };

export const POST = route<Context>(async (_request, { params }) => {
  const { groupId } = await params;
  await requireHost(groupId);
  return NextResponse.json(await generateCandidates(groupId));
});