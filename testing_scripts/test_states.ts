import assert from "node:assert";
import { db } from "../src/prisma/db";
import { canTransition, type Status } from "../src/prisma/server/lifecycle";
import {
  createGroupRecord, joinGroupRecord, findMemberByToken,
  configureGroupRecord, addCandidateRecord, startDecisionRecord,
  castVoteRecord, closeRoundRecord, resolveTieRecord,
} from "../src/prisma/server/group";

const NO_SUCH_ID = "00000000-0000-0000-0000-000000000000";
const created: string[] = [];

// ---------- Part 1: the transition table (no database) ----------
// Deliberately written out again here, so the test is a spec independent of lifecycle.ts
const ALL: Status[] = ["LOBBY", "COLLECTING", "DECIDING", "TIE_BREAK", "COMPLETE"];
const LEGAL: [Status, Status][] = [
  ["LOBBY", "COLLECTING"],
  ["COLLECTING", "DECIDING"], ["COLLECTING", "COMPLETE"], // COMPLETE = RANDOM shortcut
  ["DECIDING", "TIE_BREAK"], ["DECIDING", "COMPLETE"],
  ["TIE_BREAK", "DECIDING"], ["TIE_BREAK", "COMPLETE"],
];

function testTransitionTable() {
  for (const from of ALL) {
    for (const to of ALL) {
      const expected = LEGAL.some(([a, b]) => a === from && b === to);
      assert.equal(
        canTransition(from, to), expected,
        `${from} -> ${to} should be ${expected ? "allowed" : "blocked"}`
      );
    }
  }
  console.log("✅ transition table");
}

// ---------- Helpers ----------
const getGroup = async (groupId: string) => {
  const g = await db.orm.public.Group.where({ id: groupId }).first();
  assert(g, "group missing");
  return g;
};
const statusOf = async (groupId: string) => (await getGroup(groupId)).status as Status;
const roundsOf = (groupId: string) => db.orm.public.Round.where({ groupId }).all();

async function blocked(
  groupId: string, error: string, label: string,
  fn: () => Promise<{ ok: boolean; error?: string }>
) {
  const before = await statusOf(groupId);
  const r = await fn();
  assert(!r.ok && r.error === error, `${label}: expected ${error}, got ${JSON.stringify(r)}`);
  assert.equal(await statusOf(groupId), before, `${label}: status changed even though the action was blocked`);
}

// The action must succeed, land in `to`, and be a move the transition table allows
async function moved(
  groupId: string, to: Status, label: string,
  fn: () => Promise<{ ok: boolean }>
) {
  const before = await statusOf(groupId);
  const r = await fn();
  assert(r.ok, `${label}: ${JSON.stringify(r)}`);
  const after = await statusOf(groupId);
  assert.equal(after, to, `${label}: expected ${to}, got ${after}`);
  assert(canTransition(before, after), `${label}: ${before} -> ${after} is not in the transition table`);
}

async function idOf(token: string) {
  const m = await findMemberByToken(token);
  assert(m, "member not found");
  return m.id;
}

// A fresh group in LOBBY: returns [host, ...joiners] as member ids
async function newGroup(joiners: string[]) {
  const g = await createGroupRecord("Host");
  created.push(g.groupId);
  const memberIds = [await idOf(g.token)];
  for (const name of joiners) {
    const j = await joinGroupRecord(g.inviteCode, name);
    assert(j.ok, `join failed for ${name}`);
    memberIds.push(await idOf(j.token));
  }
  return { groupId: g.groupId, inviteCode: g.inviteCode, hostId: memberIds[0], memberIds };
}

async function addOk(memberId: string, name: string) {
  const r = await addCandidateRecord(memberId, { name });
  assert(r.ok, `add candidate failed: ${name} -> ${JSON.stringify(r)}`);
  return r.candidateId;
}

async function castAll(votes: [string, string][]) {
  for (const [memberId, candidateId] of votes) {
    const r = await castVoteRecord(memberId, candidateId);
    assert(r.ok, `vote failed -> ${JSON.stringify(r)}`);
  }
}

// ---------- Part 2: walking real groups through the states ----------
async function testVotePath() {
  const { groupId, inviteCode, hostId, memberIds } = await newGroup(["Alice", "Bob", "Carol"]);
  const [host, alice, bob, carol] = memberIds;

  // LOBBY
  let g = await getGroup(groupId);
  assert(g.status === "LOBBY" && g.model == null && g.decisionType == null, "new group should be an empty LOBBY");

  await blocked(groupId, "WRONG_STATE", "add candidate in LOBBY", () => addCandidateRecord(alice, { name: "Pizza" }));
  await blocked(groupId, "WRONG_STATE", "start in LOBBY", () => startDecisionRecord(host));
  await blocked(groupId, "WRONG_STATE", "vote in LOBBY", () => castVoteRecord(alice, NO_SUCH_ID));
  await blocked(groupId, "WRONG_STATE", "close in LOBBY", () => closeRoundRecord(host));
  await blocked(groupId, "WRONG_STATE", "resolve tie in LOBBY", () => resolveTieRecord(host, "RANDOM"));

  // configure: refusals first, and a refusal must not write anything
  await blocked(groupId, "NOT_HOST", "non-host configure",
    () => configureGroupRecord(alice, { model: "SUGGESTION", decisionType: "VOTE" }));
  await blocked(groupId, "INVALID_COMBINATION", "BEST_FIT needs PREFERENCE",
    () => configureGroupRecord(host, { model: "SUGGESTION", decisionType: "BEST_FIT" }));
  g = await getGroup(groupId);
  assert(g.model == null && g.decisionType == null, "a blocked configure must not write anything");

  // LOBBY -> COLLECTING, and the choices are stored
  await moved(groupId, "COLLECTING", "configure",
    () => configureGroupRecord(host, { model: "SUGGESTION", decisionType: "VOTE" }));
  g = await getGroup(groupId);
  assert.equal(g.model, "SUGGESTION");
  assert.equal(g.decisionType, "VOTE");

  // The choices are locked once collecting starts
  await blocked(groupId, "WRONG_STATE", "configure twice",
    () => configureGroupRecord(host, { model: "SUGGESTION", decisionType: "RANDOM" }));
  g = await getGroup(groupId);
  assert.equal(g.decisionType, "VOTE", "decision type must stay locked");

  // COLLECTING: voting actions don't exist yet
  await blocked(groupId, "WRONG_STATE", "vote in COLLECTING", () => castVoteRecord(alice, NO_SUCH_ID));
  await blocked(groupId, "WRONG_STATE", "close in COLLECTING", () => closeRoundRecord(host));
  await blocked(groupId, "WRONG_STATE", "resolve tie in COLLECTING", () => resolveTieRecord(host, "RANDOM"));

  // Starting needs the host and at least 2 candidates
  await blocked(groupId, "NOT_ENOUGH_CANDIDATES", "start with 0 candidates", () => startDecisionRecord(host));
  const pizza = await addOk(alice, "Pizza");
  await blocked(groupId, "NOT_ENOUGH_CANDIDATES", "start with 1 candidate", () => startDecisionRecord(host));
  assert.equal((await roundsOf(groupId)).length, 0, "a failed start must not create a round");
  const tacos = await addOk(bob, "Tacos");
  await blocked(groupId, "NOT_HOST", "non-host start", () => startDecisionRecord(alice));

  // COLLECTING -> DECIDING creates exactly one round with both candidates on the ballot
  await moved(groupId, "DECIDING", "start decision", () => startDecisionRecord(host));
  const rounds = await roundsOf(groupId);
  assert.equal(rounds.length, 1);
  assert.equal(rounds[0].number, 1);
  const ballot = await db.orm.public.RoundCandidate.where({ roundId: rounds[0].id }).all();
  assert.equal(ballot.length, 2);

  // A second start (double click) must not create another round
  await blocked(groupId, "WRONG_STATE", "start twice", () => startDecisionRecord(host));
  assert.equal((await roundsOf(groupId)).length, 1, "double start created a second round");

  // DECIDING: the candidate list is frozen and the config is locked
  await blocked(groupId, "WRONG_STATE", "add candidate in DECIDING", () => addCandidateRecord(carol, { name: "Sushi" }));
  await blocked(groupId, "WRONG_STATE", "configure in DECIDING",
    () => configureGroupRecord(host, { model: "SUGGESTION", decisionType: "VOTE" }));
  await blocked(groupId, "WRONG_STATE", "resolve tie in DECIDING", () => resolveTieRecord(host, "RANDOM"));
  await blocked(groupId, "NO_VOTES", "close with no votes", () => closeRoundRecord(host));
  assert.equal((await roundsOf(groupId))[0].status, "OPEN", "round must stay open after NO_VOTES");

  // 2-2 split -> DECIDING -> TIE_BREAK
  await castAll([[host, pizza], [alice, pizza], [bob, tacos], [carol, tacos]]);
  await moved(groupId, "TIE_BREAK", "close tied round", () => closeRoundRecord(host));
  assert.equal((await roundsOf(groupId))[0].status, "CLOSED");

  // TIE_BREAK: only the host's tie resolution is allowed
  await blocked(groupId, "WRONG_STATE", "add candidate in TIE_BREAK", () => addCandidateRecord(carol, { name: "Sushi" }));
  await blocked(groupId, "WRONG_STATE", "vote in TIE_BREAK", () => castVoteRecord(alice, pizza));
  await blocked(groupId, "WRONG_STATE", "close in TIE_BREAK", () => closeRoundRecord(host));
  await blocked(groupId, "WRONG_STATE", "configure in TIE_BREAK",
    () => configureGroupRecord(host, { model: "SUGGESTION", decisionType: "VOTE" }));
  await blocked(groupId, "WRONG_STATE", "start in TIE_BREAK", () => startDecisionRecord(host));
  await blocked(groupId, "NOT_HOST", "non-host resolve tie", () => resolveTieRecord(alice, "REVOTE"));

  // TIE_BREAK -> DECIDING (revote), then a clear winner -> COMPLETE
  await moved(groupId, "DECIDING", "revote", () => resolveTieRecord(host, "REVOTE"));
  assert.equal((await roundsOf(groupId)).length, 2);
  await castAll([[host, pizza], [alice, pizza], [bob, pizza], [carol, tacos]]);
  await moved(groupId, "COMPLETE", "close round 2", () => closeRoundRecord(host));

  const result = await db.orm.public.Result.where({ groupId }).first();
  assert(result && result.method === "VOTE" && result.candidateId === pizza, "result should be Pizza by VOTE");

  // COMPLETE is terminal: every action is refused, and nobody new can join
  await blocked(groupId, "WRONG_STATE", "add candidate in COMPLETE", () => addCandidateRecord(carol, { name: "Sushi" }));
  await blocked(groupId, "WRONG_STATE", "configure in COMPLETE",
    () => configureGroupRecord(host, { model: "SUGGESTION", decisionType: "VOTE" }));
  await blocked(groupId, "WRONG_STATE", "start in COMPLETE", () => startDecisionRecord(host));
  await blocked(groupId, "WRONG_STATE", "vote in COMPLETE", () => castVoteRecord(alice, pizza));
  await blocked(groupId, "WRONG_STATE", "close in COMPLETE", () => closeRoundRecord(host));
  await blocked(groupId, "WRONG_STATE", "resolve tie in COMPLETE", () => resolveTieRecord(host, "REVOTE"));
  const late = await joinGroupRecord(inviteCode, "Latecomer");
  assert(!late.ok && late.error === "NOT_FOUND", "joining a COMPLETE group should be refused");
  assert.equal(await statusOf(groupId), "COMPLETE");

  console.log("✅ vote path: LOBBY -> COLLECTING -> DECIDING -> TIE_BREAK -> DECIDING -> COMPLETE");
}

async function testRandomShortcut() {
  const { groupId, hostId, memberIds } = await newGroup(["Alice"]);
  const [host, alice] = memberIds;

  await moved(groupId, "COLLECTING", "configure RANDOM",
    () => configureGroupRecord(host, { model: "SUGGESTION", decisionType: "RANDOM" }));
  const pizza = await addOk(host, "Pizza");
  const tacos = await addOk(alice, "Tacos");

  // RANDOM skips DECIDING entirely: COLLECTING -> COMPLETE
  await moved(groupId, "COMPLETE", "start with RANDOM", () => startDecisionRecord(hostId));
  assert.equal((await roundsOf(groupId)).length, 0, "RANDOM should not create a round");

  const result = await db.orm.public.Result.where({ groupId }).first();
  assert(result && result.method === "RANDOM", "result should be RANDOM");
  assert([pizza, tacos].includes(result.candidateId), "winner must be one of the candidates");

  await blocked(groupId, "WRONG_STATE", "start again after RANDOM", () => startDecisionRecord(hostId));
  console.log("✅ random shortcut: COLLECTING -> COMPLETE");
}

async function main() {
  console.log("script started");
  try {
    testTransitionTable();
    await testVotePath();
    await testRandomShortcut();
    console.log("✅ all state checks passed");
  } finally {
    for (const id of created) await db.orm.public.Group.where({ id }).delete();
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error("❌", e); process.exit(1); });