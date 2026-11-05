"use server";

import { db } from "@/src/prisma/db";
import { AppError } from "@/src/prisma/lib/errors";
import { requireHost } from "@/src/prisma/server/session";
import {
  closeRoundRecord,
  resolveTieRecord,
  startDecisionRecord,
} from "@/src/prisma/server/group"; // adjust if group.ts lives in services/
import { generateCandidates } from "@/src/prisma/server/services/candidates";

type ActionResult = { ok: boolean; error?: string; message?: string };

const fail = (error: string, message?: string): ActionResult => ({ ok: false, error, message });

// Who is asking? Comes from the session cookie, never from the browser's say-so.
async function hostFor(groupId: string) {
  try {
    return await requireHost(groupId);
  } catch {
    return null;
  }
}

// The host's "Continue" button. What it does depends on the group's saved choices.
export async function advanceGroupAction(groupId: string): Promise<ActionResult> {
  const host = await hostFor(groupId);
  if (!host) return fail("NOT_HOST");

  const group = await db.orm.public.Group.where({ id: groupId }).first();
  if (!group) return fail("NOT_FOUND");

  try {
    // Voting is open: close the round and count.
    if (group.status === "DECIDING") {
      const result = await closeRoundRecord(host.id);
      return result.ok ? { ok: true } : fail(result.error);
    }

    if (group.status !== "COLLECTING") return fail("WRONG_STATE");

    // Preference mode: build the shortlist first, once.
    if (group.model === "PREFERENCE") {
      const existing = await db.orm.public.Candidate.where({ groupId }).all();
      if (existing.length === 0) {
        await generateCandidates(groupId);
        if (group.decisionType === "BEST_FIT") return { ok: true }; // already complete
      }
    }

    // Both modes: start the vote, or pick randomly.
    const result = await startDecisionRecord(host.id);
    return result.ok ? { ok: true } : fail(result.error);
  } catch (error) {
    // Errors we threw on purpose (missing location, Yelp down, etc.) carry a readable message.
    if (error instanceof AppError) return fail(error.code, error.message);
    console.error("advanceGroupAction failed:", error);
    return fail("UNKNOWN");
  }
}

// The host's choice after a tie.
export async function resolveTieAction(
  groupId: string,
  choice: "REVOTE" | "RANDOM",
): Promise<ActionResult> {
  // Server actions are public doors: check the argument even though the types say it's fine.
  if (choice !== "REVOTE" && choice !== "RANDOM") return fail("INVALID");

  const host = await hostFor(groupId);
  if (!host) return fail("NOT_HOST");

  try {
    const result = await resolveTieRecord(host.id, choice);
    return result.ok ? { ok: true } : fail(result.error);
  } catch (error) {
    console.error("resolveTieAction failed:", error);
    return fail("UNKNOWN");
  }
}