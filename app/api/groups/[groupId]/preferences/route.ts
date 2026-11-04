import { NextResponse } from "next/server";
import { getMember } from "@/src/server/auth/session";
import { parseBody, route } from "@/src/prisma/lib/api";
import { savePreference } from "@/src/prisma/server/services/preferences";
import { preferenceSchema } from "@/src/prisma/shared/preferenceSchemas";

type Context = { params: Promise<{ groupId: string }> };

export const PUT = route<Context>(async (request, { params }) => {
  const { groupId } = await params;
  const member = await getMember(groupId); // who are you?
  const input = await parseBody(request, preferenceSchema); // is the data valid?
  const preference = await savePreference(groupId, member.id, input);
  return NextResponse.json({ preference });
});