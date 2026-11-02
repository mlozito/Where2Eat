import { NextResponse } from "next/server";
import { requireHost } from "@/src/server/auth/session";
import { route } from "@/src/server/lib/api";
import { generateCandidates } from "@/src/server/services/candidates";

type Context = { params: Promise<{ groupId: string }> };

export const POST = route<Context>(async (_request, { params }) => {
  const { groupId } = await params;
  await requireHost(groupId);
  return NextResponse.json(await generateCandidates(groupId));
});