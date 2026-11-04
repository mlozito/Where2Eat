import { db } from "../../../prisma/db";
import { ConflictError, NotFoundError } from "../../lib/errors";
import { buildSearchQuery, pickTopRestaurants } from "./matching";
import { loadGroupPreferences } from "./preferences";
import { searchRestaurants } from "./yelp";

const CANDIDATE_COUNT = 6;

// Host-triggered: find the best 6 restaurants and save them as candidates.
export async function generateCandidates(groupId: string) {
  const group = await db.orm.public.Group.where({ id: groupId }).first();
  if (!group) throw new NotFoundError("Group not found");

  // Every guard below also stops this from running twice by accident,
  // because the status moves on once it succeeds.
  if (group.model !== "PREFERENCE") throw new ConflictError("This group is not using preference mode");
  if (!group.decisionType) throw new ConflictError("Choose a decision type first");
  if (group.status !== "COLLECTING") throw new ConflictError("The group is not collecting preferences right now");
  if (!group.location) throw new ConflictError("Set a location first");

  const prefs = await loadGroupPreferences(groupId);
  if (prefs.length === 0) throw new ConflictError("Nobody has submitted preferences yet");

  const query = buildSearchQuery(prefs);
  const found = await searchRestaurants({
    location: group.location,
    categories: query.categories,
    radiusMeters: query.radiusMeters,
  });

  const top = pickTopRestaurants(found, prefs, CANDIDATE_COUNT);
  if (top.length === 0) {
    throw new NotFoundError("No restaurants found. Try a different location or fewer filters.");
  }

  const bestFit = group.decisionType === "BEST_FIT";

  // All or nothing: candidates, the group's new status, and (for best fit) the result.
  const candidates = await db.transaction(async (tx) => {
    const saved = [];
    for (const [index, { restaurant, score }] of top.entries()) {
      const snapshot = { ...restaurant, matchScore: Math.round(score * 1000) / 1000 };
      const row = await tx.orm.public.Candidate.create({
        groupId,
        source: "YELP",
        yelpBusinessId: restaurant.yelpId ?? null,
        suggestedByMemberId: null,
        // JSON round-trip drops undefined fields so the database accepts it.
        snapshot: JSON.parse(JSON.stringify(snapshot)),
        rank: index + 1,
      });
      saved.push({ id: row.id, rank: index + 1, ...snapshot });
    }

        const decisionType = group.decisionType;

    if (decisionType === "BEST_FIT" || decisionType === "RANDOM") {
      const winner = decisionType === "BEST_FIT"
        ? saved[0]
        : saved[Math.floor(Math.random() * saved.length)];
      await tx.orm.public.Result.create({
        groupId, candidateId: winner.id, method: decisionType,
      });
      await tx.orm.public.Group.where({ id: groupId }).update({ status: "COMPLETE" });
      return { status: "COMPLETE" as const, candidates: saved };
    }

    // VOTE: open round 1 with all 6 candidates on the ballot
    const round = await tx.orm.public.Round.create({ groupId, number: 1 });
    await tx.orm.public.RoundCandidate.createAll(
      saved.map((c) => ({ roundId: round.id, candidateId: c.id }))
    );
    await tx.orm.public.Group.where({ id: groupId }).update({ status: "DECIDING" });
    return { status: "DECIDING" as const, candidates: saved };
  });

  return candidates;
}



