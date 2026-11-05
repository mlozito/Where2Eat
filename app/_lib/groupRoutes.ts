type GroupSummary = {
  groupId: string;
  status: string;
  model: string | null;
  decisionType: string | null;
};

// TODO: change the page names to match our real flow
export function pathForGroup(g: GroupSummary): string {
  const q = `?group=${encodeURIComponent(g.groupId)}`;

  switch (g.status) {
    case "COLLECTING":
      return g.model === "PREFERENCE" ? `/preferences${q}` : `/restaurant_search${q}`;
    case "DECIDING":
    case "TIE_BREAK":
      return `/waiting${q}`;
    case "COMPLETE":
      if (g.decisionType === "RANDOM") return `/wheel${q}`;
      if (g.decisionType === "BEST_FIT") return `/best_match${q}`;
      if (g.decisionType === "VOTE") return `/vote${q}`;
      return `/result${q}`;
    default:
      return `/lobby${q}`;
  }
}