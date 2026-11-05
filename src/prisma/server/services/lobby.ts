import { db } from "../../db";
import { NotFoundError } from "../../lib/errors";

export type LobbyMember = {
  id: string;
  displayName: string;
  isHost: boolean;
  done: boolean;
};

export type LobbyOption = { candidateId: string; rank: number | null; snapshot: unknown };

export type LobbyState = {
  groupId: string;
  inviteCode: string;
  status: string;
  model: string | null;
  decisionType: string | null;
  location: string | null;
  members: LobbyMember[];
  youId: string;
  youAreHost: boolean;
  youDone: boolean;
  round: number | null;
  options: LobbyOption[];
  result: { candidateId: string; method: string } | null;
};

export async function getLobby(groupId: string, viewerId: string): Promise<LobbyState> {
  const group = await db.orm.public.Group.where({ id: groupId }).first();
  if (!group) throw new NotFoundError("Group not found");

  const rows = await db.orm.public.Member.where({ groupId }).all();
  const candidates = await db.orm.public.Candidate.where({ groupId }).all();
  const rounds = await db.orm.public.Round.where({ groupId }).all();
  const result = await db.orm.public.Result.where({ groupId }).first();

  const currentRound =
    rounds.filter((r) => r.status === "OPEN").sort((a, b) => b.number - a.number)[0] ?? null;

  let votedIds = new Set<string>();
  let inRound = new Set<string>();
  if (currentRound) {
    const votes = await db.orm.public.Vote.where({ roundId: currentRound.id }).all();
    votedIds = new Set(votes.map((v) => v.memberId));
    const entries = await db.orm.public.RoundCandidate.where({ roundId: currentRound.id }).all();
    inRound = new Set(entries.map((e) => e.candidateId));
  }

  const preferenceIds = new Set<string>();
  if (group.model === "PREFERENCE" && group.status === "COLLECTING") {
    const found = await Promise.all(
      rows.map((m) => db.orm.public.Preference.where({ memberId: m.id }).first()),
    );
    found.forEach((p, i) => p && preferenceIds.add(rows[i].id));
  }

  const suggesters = new Set(
  candidates.flatMap((c) => (c.suggestedByMemberId ? [c.suggestedByMemberId] : [])),
  );

  function isDone(memberId: string): boolean {
    switch (group!.status) {
      case "COLLECTING":
        return group!.model === "PREFERENCE"
          ? preferenceIds.has(memberId)
          : suggesters.has(memberId);
      case "DECIDING":
      case "TIE_BREAK":
        return votedIds.has(memberId);
      case "COMPLETE":
        return true;
      default:
        return false;
    }
  }

  const members: LobbyMember[] = rows
    .map((m) => ({
      id: m.id,
      displayName: m.displayName,
      isHost: m.isHost,
      done: isDone(m.id),
      joinedAt: String(m.createdAt),
    }))
    .sort((a, b) => Number(b.isHost) - Number(a.isHost) || a.joinedAt.localeCompare(b.joinedAt))
    .map(({ joinedAt: _joinedAt, ...member }) => member);

  const options: LobbyOption[] = candidates
    .filter((c) => !currentRound || inRound.has(c.id))
    .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
    .map((c) => ({ candidateId: c.id, rank: c.rank, snapshot: c.snapshot }));

  const latestRound = rounds.length ? rounds.reduce((a, b) => (b.number > a.number ? b : a)) : null;

  return {
    groupId,
    inviteCode: group.inviteCode,
    status: group.status,
    model: group.model,
    decisionType: group.decisionType,
    location: group.location,
    members,
    youId: viewerId,
    youAreHost: members.some((m) => m.id === viewerId && m.isHost),
    youDone: members.some((m) => m.id === viewerId && m.done),
    round: latestRound?.number ?? null,
    options,
    result: result ? { candidateId: result.candidateId, method: result.method } : null,
  };
}