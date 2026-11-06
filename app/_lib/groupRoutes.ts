import type { LobbyState } from "@/src/prisma/server/services/lobby";

// controls for each page transition based on candidate mode / decision mode
type Stage = Pick<LobbyState, "groupId" | "status" | "model" | "youDone" | "result">;

// allowedPaths: each avaliable path based on state
export function allowedPaths(g: Stage): string[] {
  switch (g.status) {
    case "LOBBY":
      return ["/lobby"];
    case "COLLECTING":
      if (g.youDone) return ["/waiting"];
      return [g.model === "PREFERENCE" ? "/preferences" : "/suggest"];
    case "DECIDING":
      return g.youDone ? ["/waiting"] : ["/vote"];
    case "TIE_BREAK":
      return ["/waiting"];
    case "COMPLETE": {
      const random = g.result?.method === "RANDOM" || g.result?.method === "TIE_RANDOM";
      return random ? ["/random", "/result"] : ["/result"];
    }
    default:
      return ["/lobby"];
  }
}

export function withGroup(path: string, groupId: string) {
  return `${path}?group=${encodeURIComponent(groupId)}`;
}

export function pathForGroup(g: Stage): string {
  return withGroup(allowedPaths(g)[0], g.groupId);
}