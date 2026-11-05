export type Status = "LOBBY" | "COLLECTING" | "DECIDING" | "TIE_BREAK" | "COMPLETE";

const ALLOWED: Record<Status, Status[]> = {
  LOBBY: ["COLLECTING"],
  COLLECTING: ["DECIDING", "COMPLETE"], // COMPLETE directly for RANDOM / BEST_FIT
  DECIDING: ["TIE_BREAK", "COMPLETE"],
  TIE_BREAK: ["DECIDING", "COMPLETE"], // revote, or TIE_RANDOM
  COMPLETE: [],
};

export const canTransition = (from: Status, to: Status) => ALLOWED[from].includes(to);
export const MAX_ROUNDS = 3;