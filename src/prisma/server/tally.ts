export function tally(votedFor: string[], ballot: string[]) {
  const counts: Record<string, number> = Object.fromEntries(ballot.map((id) => [id, 0]));
  for (const id of votedFor) if (id in counts) counts[id]++;
  const max = Math.max(0, ...Object.values(counts));
  const leaders = max === 0 ? [] : Object.keys(counts).filter((id) => counts[id] === max);
  return { counts, max, leaders }; // leaders.length > 1 means a tie
}