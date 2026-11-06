"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useGroupStage } from "../_lib/useGroupStage";
import { advanceGroupAction, resolveTieAction } from "./actions";
import { MAX_ROUNDS } from "@/src/prisma/server/lifecycle";

const button =
  "rounded-full bg-orange-500 px-6 py-4 text-lg font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-stone-300";

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-orange-50 px-4 py-10 text-stone-900">
      <div className="mx-auto max-w-3xl">{children}</div>
    </main>
  );
}

export default function ProgressRoom({ groupId }: { groupId: string }) {
  // page control with group flow
  const { lobby, error, refresh, ready } = useGroupStage(groupId);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [skipping, setSkipping] = useState(false); // host chose to go on without stragglers

  if (error) {
    return (
      <Shell>
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
          <h1 className="mb-3 text-2xl font-semibold">{error}</h1>
          <Link href="/join" className="inline-block rounded-full bg-orange-500 px-6 py-3 font-semibold text-white hover:bg-orange-600">
            Join a group
          </Link>
        </div>
      </Shell>
    );
  }
  if (!lobby || !ready) {
    return (
      <Shell>
        <p className="text-center text-lg font-medium">Loading...</p>
      </Shell>
    );
  }

  const { members } = lobby;
  const voting = lobby.status === "DECIDING";
  const tie = lobby.status === "TIE_BREAK";
  const doneCount = members.filter((m) => m.done).length;
  const allDone = doneCount === members.length;
  const canContinue = allDone || skipping;
  const waitingOn = members.filter((m) => !m.done && m.id !== lobby.youId);

  const heading = tie
    ? "It's a tie!"
    : voting
      ? "Waiting for everyone to vote"
      : lobby.model === "PREFERENCE"
        ? "Waiting for everyone's preferences"
        : "Waiting for everyone to pick";

  const continueLabel = voting
    ? "Reveal the results"
    : lobby.decisionType === "BEST_FIT"
      ? "Find our best match"
      : lobby.decisionType === "RANDOM"
        ? lobby.model === "PREFERENCE" ? "Find restaurants and pick one" : "Pick Randomly"
        : lobby.model === "PREFERENCE" ? "Find restaurants and start voting" : "Start Voting";

  const MESSAGES: Record<string, string> = {
  NOT_HOST: "Only the host can do that.",
  WRONG_STATE: "The group has already moved on.",
  NOT_ENOUGH_CANDIDATES: "There need to be at least two restaurants first.",
  NO_VOTES: "Nobody has voted yet.",
  MAX_ROUNDS_REACHED: "No more re-votes. Pick randomly instead.",
  };

  async function run(work: () => Promise<{ ok: boolean; error?: string; message?: string }>) {
    setBusy(true);
    setMessage("");
    const result = await work();
    setBusy(false);
    if (!result.ok) {
      setMessage(result.message ?? MESSAGES[result.error ?? ""] ?? "Something went wrong. Try again.");
    }
    refresh();
  }

  return (
    <Shell>
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-orange-600">
          Waiting room
        </p>
        <h1 className="mt-3 text-4xl font-bold">{heading}</h1>

        {!tie && (
          <>
            <p className="mt-3 text-stone-600">
              {doneCount} of {members.length} ready
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-orange-100">
              <div
                className="h-full rounded-full bg-orange-500 transition-all"
                style={{ width: `${(doneCount / members.length) * 100}%` }}
              />
            </div>
          </>
        )}
      </header>

      <div className="space-y-6">
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Your group</h2>
          <ul aria-live="polite" className="divide-y divide-stone-100">
            {members.map((member) => (
              <li key={member.id} className="flex items-center justify-between gap-4 py-3">
                <span className="font-medium">
                  {member.displayName}
                  {member.isHost && (
                    <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-800">
                      Host
                    </span>
                  )}
                </span>
                {!tie && (
                  <span className={`text-sm ${member.done ? "font-medium text-green-700" : "text-stone-500"}`}>
                    {member.done ? (voting ? "Voted ✓" : "Ready ✓") : "Still going…"}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>

        {lobby.youAreHost ? (
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-xl font-semibold">Host controls</h2>

            {tie ? (
              <>
                <p className="mb-5 text-sm text-stone-500">How should the tie be settled?</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button type="button" className={button} disabled={busy} onClick={() => run(() => resolveTieAction(groupId, "REVOTE"))}>
                    Vote Again on the Tied Options
                  </button>
                  <button type="button" className={button} disabled={busy} onClick={() => run(() => resolveTieAction(groupId, "RANDOM"))}>
                    Pick Randomly from the Tied Options
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="mb-5 text-sm text-stone-500">
                  {allDone ? "Everyone's ready!" : "You can continue once everyone is ready."}
                </p>
                <button
                  type="button"
                  className={`${button} w-full`}
                  disabled={!canContinue || busy}
                  onClick={() => run(() => advanceGroupAction(groupId))}
                >
                  {busy ? "Working…" : `${continueLabel}`}
                </button>

                {!allDone && !skipping && waitingOn.length > 0 && (
                  <button
                    type="button"
                    className="mt-5 text-sm font-medium text-orange-700 underline hover:text-orange-900"
                    onClick={() => {
                      const names = waitingOn.map((m) => m.displayName).join(", ");
                      if (window.confirm(`Continue without ${names}? Anything they haven't submitted won't count.`)) {
                        setSkipping(true);
                      }
                    }}
                  >
                    Taking too long? Continue without {waitingOn.map((m) => m.displayName).join(", ")}
                  </button>
                )}
              </>
            )}

            {message && <p className="mt-3 text-sm text-red-700">{message}</p>}
          </section>
        ) : (
          <section className="rounded-2xl bg-white p-6 text-center shadow-sm">
            <p className="text-lg font-medium">
              {tie
                ? "It's a tie! Waiting for the host to decide…"
                : allDone
                  ? "Everyone's ready! Waiting for the host to continue…"
                  : "Hang tight while everyone finishes."}
            </p>
          </section>
        )}
      </div>
    </Shell>
  );
}