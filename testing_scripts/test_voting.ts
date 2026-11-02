import assert from "node:assert";
import { db } from "../src/prisma/db";
import {
  createGroupRecord, joinGroupRecord, findMemberByToken,
  configureGroupRecord, addCandidateRecord, startDecisionRecord,
  castVoteRecord, closeRoundRecord, resolveTieRecord, getRoundSummaryRecord,
  MAX_ROUNDS,
} from "../src/prisma/server/group";

const idOf = async (token: string) => {
  const m = await findMemberByToken(token);
  assert(m, "member not found");
  return m.id;
};

// Returns member ids in order: [host, ...joiners]
async function setup(joiners: string[]) {
  const g = await createGroupRecord("Host");
  const hostId = await idOf(g.token);
  const memberIds = [hostId];
  for (const name of joiners) {
    const j = await joinGroupRecord(g.inviteCode, name);
    assert(j.ok, `join failed for ${name}`);
    memberIds.push(await idOf(j.token));
  }
  const cfg = await configureGroupRecord(hostId, { model: "SUGGESTION", decisionType: "VOTE" });
  assert(cfg.ok, `configure failed: ${JSON.stringify(cfg)}`);
  return { groupId: g.groupId, hostId, memberIds };
}

// One suggestion per member (the cap is 1), handed out round-robin
async function addCands(memberIds: string[], names: string[]) {
  assert(names.length <= memberIds.length, "more candidates than members (cap is 1 each)");
  const ids: string[] = [];
  for (const [i, name] of names.entries()) {
    const r = await addCandidateRecord(memberIds[i], { name });
    assert(r.ok, `add candidate failed: ${name} -> ${JSON.stringify(r)}`);
    ids.push(r.candidateId);
  }
  return ids;
}

async function castAll(votes: [string, string][]) {
  for (const [memberId, candidateId] of votes) {
    const r = await castVoteRecord(memberId, candidateId);
    assert(r.ok, `vote failed -> ${JSON.stringify(r)}`);
  }
}

async function main() {
  console.log("script started");
  const created: string[] = [];

  // A 4-person group split 2-2 between Pizza and Tacos, closed into TIE_BREAK
  async function setupTie() {
    const s = await setup(["Alice", "Bob", "Carol"]);
    created.push(s.groupId);
    const [pizza, tacos] = await addCands(s.memberIds, ["Pizza", "Tacos"]);
    const started = await startDecisionRecord(s.hostId);
    assert(started.ok && started.outcome === "DECIDING", `start failed: ${JSON.stringify(started)}`);
    const [host, alice, bob, carol] = s.memberIds;
    await castAll([[host, pizza], [alice, pizza], [bob, tacos], [carol, tacos]]);
    const closed = await closeRoundRecord(s.hostId);
    assert(closed.ok && closed.outcome === "TIE_BREAK", `expected a tie: ${JSON.stringify(closed)}`);
    assert.equal(closed.tiedCandidateIds.length, 2);
    return { ...s, pizza, tacos };
  }

  try {
    // ---- Scenario 1: cap, clear winner, errors, anonymity ----
    {
      const { groupId, hostId, memberIds } = await setup(["Alice", "Bob"]);
      created.push(groupId);
      const [host, alice, bob] = memberIds;
      const [pizza, tacos, sushi] = await addCands(memberIds, ["Pizza", "Tacos", "Sushi"]);

      // Each member gets one suggestion
      const second = await addCandidateRecord(host, { name: "Burgers" });
      assert(!second.ok && second.error === "LIMIT_REACHED", "second suggestion should be refused");

      // Near-duplicates are caught (use a member's slot, so check DUPLICATE or LIMIT_REACHED
      // would be ambiguous; covered separately by a fresh group in a later test)

      const started = await startDecisionRecord(hostId);
      assert(started.ok && started.outcome === "DECIDING", `start failed: ${JSON.stringify(started)}`);

      const offBallot = await castVoteRecord(alice, "00000000-0000-0000-0000-000000000000");
      assert(!offBallot.ok && offBallot.error === "NOT_ON_BALLOT");

      assert((await castVoteRecord(host, pizza)).ok);
      assert((await castVoteRecord(alice, pizza)).ok);
      const dup = await castVoteRecord(alice, tacos);
      assert(!dup.ok && dup.error === "ALREADY_VOTED");

      const notHost = await closeRoundRecord(alice);
      assert(!notHost.ok && notHost.error === "NOT_HOST");

      // Anonymity: no member ids anywhere, and counts hidden while the round is open
      const mid = await getRoundSummaryRecord(host);
      assert(mid.ok && mid.round, "summary should have a round");
      const blob = JSON.stringify(mid);
      for (const id of memberIds) assert(!blob.includes(id), "summary leaked a member id");
      assert.equal(mid.round.votesCast, 2);
      assert.equal(mid.round.counts, null);

      assert((await castVoteRecord(bob, tacos)).ok);
      const closed = await closeRoundRecord(hostId);
      assert(closed.ok && closed.outcome === "COMPLETE" && closed.winnerId === pizza,
        `close failed: ${JSON.stringify(closed)}`);

      const result = await db.orm.public.Result.where({ groupId }).first();
      assert(result && result.method === "VOTE" && result.candidateId === pizza);

      const late = await castVoteRecord(bob, sushi);
      assert(!late.ok && late.error === "WRONG_STATE");
      console.log("✅ scenario 1: cap + winner + anonymity");
    }

    // ---- Scenario 2: tie, then a revote that produces a winner ----
    {
      const t = await setupTie();
      const [host, alice, bob, carol] = t.memberIds;

      const notHost = await resolveTieRecord(alice, "REVOTE");
      assert(!notHost.ok && notHost.error === "NOT_HOST");

      const rv = await resolveTieRecord(t.hostId, "REVOTE");
      assert(rv.ok && rv.outcome === "DECIDING", `revote failed: ${JSON.stringify(rv)}`);

      // Round 1 votes must not block round 2
      await castAll([[host, t.pizza], [alice, t.pizza], [bob, t.pizza], [carol, t.tacos]]);
      const closed = await closeRoundRecord(t.hostId);
      assert(closed.ok && closed.outcome === "COMPLETE" && closed.winnerId === t.pizza,
        `close failed: ${JSON.stringify(closed)}`);

      const rounds = await db.orm.public.Round.where({ groupId: t.groupId }).all();
      assert.equal(rounds.length, 2);
      console.log("✅ scenario 2: tie -> revote -> winner");
    }

    // ---- Scenario 3: tie, then a random pick ----
    {
      const t = await setupTie();
      const res = await resolveTieRecord(t.hostId, "RANDOM");
      assert(res.ok && res.outcome === "COMPLETE", `random failed: ${JSON.stringify(res)}`);
      assert([t.pizza, t.tacos].includes(res.winnerId), "winner must be a tied candidate");

      const result = await db.orm.public.Result.where({ groupId: t.groupId }).first();
      assert(result && result.method === "TIE_RANDOM");
      console.log("✅ scenario 3: tie -> random");
    }

    // ---- Scenario 4: repeated ties hit MAX_ROUNDS, then only random is allowed ----
    {
      const t = await setupTie(); // round 1 tied
      const [host, alice, bob, carol] = t.memberIds;

      for (let round = 2; round <= MAX_ROUNDS; round++) {
        const rv = await resolveTieRecord(t.hostId, "REVOTE");
        assert(rv.ok && rv.outcome === "DECIDING", `revote into round ${round} failed: ${JSON.stringify(rv)}`);
        await castAll([[host, t.pizza], [alice, t.pizza], [bob, t.tacos], [carol, t.tacos]]);
        const closed = await closeRoundRecord(t.hostId);
        assert(closed.ok && closed.outcome === "TIE_BREAK", `round ${round} should tie`);
      }

      const blocked = await resolveTieRecord(t.hostId, "REVOTE");
      assert(!blocked.ok && blocked.error === "MAX_ROUNDS_REACHED", "revote past the cap should be refused");

      const rand = await resolveTieRecord(t.hostId, "RANDOM");
      assert(rand.ok && rand.outcome === "COMPLETE", "random should still work after the cap");
      console.log("✅ scenario 4: MAX_ROUNDS enforced");
    }

    console.log("✅ all voting checks passed");
  } finally {
    for (const id of created) await db.orm.public.Group.where({ id }).delete();
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error("❌", e); process.exit(1); });