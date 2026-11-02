import { NextResponse } from "next/server";
import { requireHost } from "@/src/server/auth/session";
import { parseBody, route } from "@/src/prisma/lib/api";
import { setGroupLocation } from "@/src/prisma/server/services/preferences";
import { locationSchema } from "@/src/prisma/shared/preferenceSchemas";

type Context = { params: Promise<{ groupId: string }> };

export const PUT = route<Context>(async (request, { params }) => {
  const { groupId } = await params;
  await requireHost(groupId);
  const { location } = await parseBody(request, locationSchema);
  return NextResponse.json(await setGroupLocation(groupId, location));
});