"use server";

import { randomBytes, randomInt } from "node:crypto";
import { db } from "../../prisma/db";
import { tally } from "./tally"; 
import { sha256 } from "../lib/crypto"



const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
const CODE_LENGTH = 6;

const makeInviteCode = () =>
  Array.from({ length: CODE_LENGTH }, () => CODE_CHARS[randomInt(CODE_CHARS.length)]).join("");

const normalizeCode = (s: string) => s.trim().toUpperCase();

const newToken = () => randomBytes(32).toString("base64url");

// NUMBER OF CANDIDATES EACH MEMBER CAN SUGGEST
const MAX_PER_MEMBER = 1;

const normalizeName = (s: string) =>
  s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
   .toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();


// NEW GROUP CREATED BY HOST: create a new group record
export async function createGroupRecord(hostName: string) {
  // Find an unused code (the @unique constraint is the backstop)
  let inviteCode = "";
  for (let i = 0; i < 5; i++) {
    const candidate = makeInviteCode();
    const taken = await db.orm.public.Group.where({ inviteCode: candidate }).first();
    if (!taken) { inviteCode = candidate; break; }
  }
  if (!inviteCode) throw new Error("Could not generate an invite code");

  // Group + host together, so you never get a group with no host
  const token = newToken();
  const group = await db.transaction(async (tx) => {
    const group = await tx.orm.public.Group.create({ inviteCode });
    await tx.orm.public.Member.create({
      groupId: group.id,
      displayName: hostName,
      isHost: true,
      sessionTokenHash: sha256(token),
    });
    return group;
  });

  return { groupId: group.id, inviteCode, token };
}

// MEMBER JOINS GROUP
export async function joinGroupRecord(rawInviteCode: string, displayName: string) {
  const inviteCode = normalizeCode(rawInviteCode);

  const group = await db.orm.public.Group.where({ inviteCode }).first();
  if (!group || group.status === "COMPLETE") {
    return { ok: false as const, error: "NOT_FOUND" as const };
  }

  const taken = await db.orm.public.Member
    .where({ groupId: group.id, displayName }).first();
  if (taken) return { ok: false as const, error: "NAME_TAKEN" as const };

  const token = newToken();
  await db.orm.public.Member.create({
    groupId: group.id,
    displayName,
    sessionTokenHash: sha256(token),
  });
  return { ok: true as const, groupId: group.id, token };
}

// Helper function
export async function findMemberByToken(token: string) {
  return db.orm.public.Member.where({ sessionTokenHash: sha256(token) }).first();
}


// STATE TRANSITIONS
// loadContext determines current state
async function loadContext(memberId: string) {
  const member = await db.orm.public.Member.where({ id: memberId }).first();
  if (!member) return null;
  const group = await db.orm.public.Group.where({ id: member.groupId }).first();
  return group ? { member, group } : null;
}

// LOBBY -> COLLECTING: host picks the model + decision type, which locks them
export async function configureGroupRecord(memberId: string, input: {
  model: "SUGGESTION" | "PREFERENCE";
  decisionType: "VOTE" | "RANDOM" | "BEST_FIT";
  location?: string;
}) {
  const ctx = await loadContext(memberId);
  if (!ctx) return { ok: false as const, error: "NOT_FOUND" as const };
  if (!ctx.member.isHost) return { ok: false as const, error: "NOT_HOST" as const };
  if (ctx.group.status !== "LOBBY") return { ok: false as const, error: "WRONG_STATE" as const };

  if (input.decisionType === "BEST_FIT" && input.model !== "PREFERENCE")
    return { ok: false as const, error: "INVALID_COMBINATION" as const };
  
  // Conditional on the old status, so a double click can't apply twice
  await db.orm.public.Group
    .where({ id: ctx.group.id, status: "LOBBY" })
    .update({
      model: input.model,
      decisionType: input.decisionType,
      location: input.location ?? null,
      status: "COLLECTING",
    });
  return { ok: true as const };
}


// adding suggestions for random selection or vote (adding a "Candidate")
export async function addCandidateRecord(
  memberId: string,
  input: { name: string; address?: string }
) {
  const ctx = await loadContext(memberId);
  if (!ctx) return { ok: false as const, error: "NOT_FOUND" as const };
  const { member, group } = ctx;
  if (group.status !== "COLLECTING" || group.model !== "SUGGESTION")
    return { ok: false as const, error: "WRONG_STATE" as const };

  const existing = await db.orm.public.Candidate.where({ groupId: group.id }).all();

  if (existing.filter(c => c.suggestedByMemberId === member.id).length >= MAX_PER_MEMBER)
    return { ok: false as const, error: "LIMIT_REACHED" as const };

  const key = normalizeName(input.name);
  if (existing.some(c => normalizeName((c.snapshot as { name: string }).name) === key))
    return { ok: false as const, error: "DUPLICATE" as const };

  const created = await db.orm.public.Candidate.create({
    groupId: group.id,
    source: "USER_SUGGESTED",
    suggestedByMemberId: member.id,
    snapshot: { name: input.name.trim(), address: input.address ?? null },
  });
  return { ok: true as const, candidateId: created.id };
}

// COLLECTING -> DECIDING (VOTE) or COMPLETE (RANDOM)
// RANDOM code housed here
// initiates the vote
export async function startDecisionRecord(memberId: string) {
  const ctx = await loadContext(memberId);
  if (!ctx) return { ok: false as const, error: "NOT_FOUND" as const };
  if (!ctx.member.isHost) return { ok: false as const, error: "NOT_HOST" as const };

  return db.transaction(async (tx) => {
    // Re-read inside the transaction so the checks and writes see the same state
    const group = await tx.orm.public.Group.where({ id: ctx.group.id }).first();
    if (!group || group.status !== "COLLECTING" || group.model !== "SUGGESTION")
      return { ok: false as const, error: "WRONG_STATE" as const };

    const candidates = await tx.orm.public.Candidate.where({ groupId: group.id }).all();
    if (candidates.length < 2)
      return { ok: false as const, error: "NOT_ENOUGH_CANDIDATES" as const };

    // RANDOM SELECTION:
    if (group.decisionType === "RANDOM") {
      const winner = candidates[randomInt(candidates.length)];
      await tx.orm.public.Result.create({
        groupId: group.id, candidateId: winner.id, method: "RANDOM",
      });
      await tx.orm.public.Group.where({ id: group.id }).update({ status: "COMPLETE" });
      return { ok: true as const, outcome: "COMPLETE" as const, winnerId: winner.id };
    }

    // VOTE: the ballot is the RoundCandidate rows, not the Candidate table
    const round = await tx.orm.public.Round.create({ groupId: group.id, number: 1 });
    await tx.orm.public.RoundCandidate.createAll(
      candidates.map(c => ({ roundId: round.id, candidateId: c.id }))
    );
    await tx.orm.public.Group.where({ id: group.id }).update({ status: "DECIDING" });
    return { ok: true as const, outcome: "DECIDING" as const, roundId: round.id };
  });
}


type Client = Pick<typeof db, "orm">;

async function roundTally(client: Client, roundId: string) {
  const ballot = await client.orm.public.RoundCandidate.where({ roundId }).all();
  const votes = await client.orm.public.Vote.where({ roundId }).all();
  return {
    votes,
    ...tally(votes.map((v) => v.candidateId), ballot.map((b) => b.candidateId)),
  };
}

export async function castVoteRecord(memberId: string, candidateId: string) {
  const ctx = await loadContext(memberId);
  if (!ctx) return { ok: false as const, error: "NOT_FOUND" as const };

  return db.transaction(async (tx) => {
    const group = await tx.orm.public.Group.where({ id: ctx.group.id }).first();
    if (!group || group.status !== "DECIDING")
      return { ok: false as const, error: "WRONG_STATE" as const };

    const round = await tx.orm.public.Round
      .where({ groupId: group.id, status: "OPEN" }).first();
    if (!round) return { ok: false as const, error: "WRONG_STATE" as const };

    // The database doesn't check this, so the code has to
    const onBallot = await tx.orm.public.RoundCandidate
      .where({ roundId: round.id, candidateId }).first();
    if (!onBallot) return { ok: false as const, error: "NOT_ON_BALLOT" as const };

    const already = await tx.orm.public.Vote.where({ roundId: round.id, memberId }).first();
    if (already) return { ok: false as const, error: "ALREADY_VOTED" as const };

    await tx.orm.public.Vote.create({ roundId: round.id, memberId, candidateId });
    return { ok: true as const };
  });
}

export async function closeRoundRecord(memberId: string) {
  const ctx = await loadContext(memberId);
  if (!ctx) return { ok: false as const, error: "NOT_FOUND" as const };
  if (!ctx.member.isHost) return { ok: false as const, error: "NOT_HOST" as const };

  return db.transaction(async (tx) => {
    const group = await tx.orm.public.Group.where({ id: ctx.group.id }).first();
    if (!group || group.status !== "DECIDING")
      return { ok: false as const, error: "WRONG_STATE" as const };

    const round = await tx.orm.public.Round
      .where({ groupId: group.id, status: "OPEN" }).first();
    if (!round) return { ok: false as const, error: "WRONG_STATE" as const };

    const { votes, counts, leaders } = await roundTally(tx, round.id);
    if (votes.length === 0) return { ok: false as const, error: "NO_VOTES" as const };

    await tx.orm.public.Round.where({ id: round.id }).update({ status: "CLOSED" });

    if (leaders.length === 1) {
      await tx.orm.public.Result.create({
        groupId: group.id, candidateId: leaders[0], method: "VOTE",
      });
      await tx.orm.public.Group.where({ id: group.id }).update({ status: "COMPLETE" });
      return { ok: true as const, outcome: "COMPLETE" as const, winnerId: leaders[0], counts };
    }

    await tx.orm.public.Group.where({ id: group.id }).update({ status: "TIE_BREAK" });
    return { ok: true as const, outcome: "TIE_BREAK" as const, tiedCandidateIds: leaders, counts };
  });
}

const MAX_ROUNDS = 3;

export async function resolveTieRecord(memberId: string, choice: "REVOTE" | "RANDOM") {
  const ctx = await loadContext(memberId);
  if (!ctx) return { ok: false as const, error: "NOT_FOUND" as const };
  if (!ctx.member.isHost) return { ok: false as const, error: "NOT_HOST" as const };

  return db.transaction(async (tx) => {
    const group = await tx.orm.public.Group.where({ id: ctx.group.id }).first();
    if (!group || group.status !== "TIE_BREAK")
      return { ok: false as const, error: "WRONG_STATE" as const };

    const rounds = await tx.orm.public.Round.where({ groupId: group.id }).all();
    const last = rounds.reduce((a, b) => (b.number > a.number ? b : a));

    // Recompute the tied candidates from the data; never trust the client's list
    const { leaders } = await roundTally(tx, last.id);
    if (leaders.length < 2) return { ok: false as const, error: "WRONG_STATE" as const };

    if (choice === "REVOTE") {
      if (last.number >= MAX_ROUNDS)
        return { ok: false as const, error: "MAX_ROUNDS_REACHED" as const };
      const next = await tx.orm.public.Round.create({ groupId: group.id, number: last.number + 1 });
      await tx.orm.public.RoundCandidate.createAll(
        leaders.map((id) => ({ roundId: next.id, candidateId: id }))
      );
      await tx.orm.public.Group.where({ id: group.id }).update({ status: "DECIDING" });
      return { ok: true as const, outcome: "DECIDING" as const, roundId: next.id };
    }

    const winnerId = leaders[randomInt(leaders.length)];
    await tx.orm.public.Result.create({
      groupId: group.id, candidateId: winnerId, method: "TIE_RANDOM",
    });
    await tx.orm.public.Group.where({ id: group.id }).update({ status: "COMPLETE" });
    return { ok: true as const, outcome: "COMPLETE" as const, winnerId };
  });
}

// What the UI polls. Aggregates only: no member ids, and counts stay hidden until the round closes
export async function getRoundSummaryRecord(memberId: string) {
  const ctx = await loadContext(memberId);
  if (!ctx) return { ok: false as const, error: "NOT_FOUND" as const };

  const rounds = await db.orm.public.Round.where({ groupId: ctx.group.id }).all();
  if (rounds.length === 0) return { ok: true as const, round: null };
  const latest = rounds.reduce((a, b) => (b.number > a.number ? b : a));

  const { votes, counts } = await roundTally(db, latest.id);
  const members = await db.orm.public.Member.where({ groupId: ctx.group.id }).all();

  return {
    ok: true as const,
    round: {
      number: latest.number,
      status: latest.status,
      votesCast: votes.length,
      memberCount: members.length,
      iVoted: votes.some((v) => v.memberId === memberId),
      counts: latest.status === "CLOSED" ? counts : null,
    },
  };
}