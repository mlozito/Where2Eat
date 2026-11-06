"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loading, Shell } from "../_components/shell";
import RestaurantCard, { asSnapshot } from "../_components/restaurantCard";
import { withGroup } from "../_lib/groupRoutes";
import { useGroupStage } from "../_lib/useGroupStage";
import { castVoteAction } from "./actions";

const MESSAGES: Record<string, string> = {
  NOT_MEMBER: "You're not in this group.",
  WRONG_STATE: "Voting is closed.",
  NOT_ON_BALLOT: "That restaurant isn't on this ballot.",
  ALREADY_VOTED: "You've already voted this round.",
};

export default function VoteRoom({ groupId }: { groupId: string }) {
  const router = useRouter();
  const { lobby, error, ready } = useGroupStage(groupId);
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  if (error) return <Shell><p className="rounded-2xl bg-white p-6 shadow-sm">{error}</p></Shell>;
  if (!lobby || !ready) return <Loading />;

  // During DECIDING, getLobby only returns the candidates on the current round's ballot
  const ballot = lobby.options;
  const revote = (lobby.round ?? 1) > 1;

  function submit() {
    if (!selected) return;
    setMessage("");
    startTransition(async () => {
      const result = await castVoteAction(groupId, selected);
      if (result.ok || result.error === "ALREADY_VOTED") {
        router.push(withGroup("/waiting", groupId));
        return;
      }
      setMessage(MESSAGES[result.error] ?? "Something went wrong.");
    });
  }

  return (
    <Shell>
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-orange-600">
          {revote ? `Tie-breaker · Round ${lobby.round}` : "Anonymous vote"}
        </p>
        <h1 className="mt-3 text-4xl font-bold">
          {revote ? "Vote again on the tied picks" : "Pick your favorite"}
        </h1>
        <p className="mt-3 text-stone-600">Nobody will see what you voted for.</p>
      </header>

      <ul role="radiogroup" aria-label="Restaurants" className="space-y-3">
        {ballot.map((option) => {
          const isSelected = selected === option.candidateId;
          return (
            <li key={option.candidateId}>
              <button
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => { setSelected(option.candidateId); setMessage(""); }}
                className={`w-full rounded-2xl border-2 bg-white p-5 text-left shadow-sm transition ${
                  isSelected ? "border-orange-500" : "border-transparent hover:border-orange-200"
                }`}
              >
                <RestaurantCard snapshot={asSnapshot(option.snapshot)} />
              </button>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={submit}
        disabled={!selected || pending}
        className="mt-6 w-full rounded-full bg-orange-500 px-6 py-4 text-lg font-semibold text-white transition hover:bg-orange-600 disabled:bg-stone-300"
      >
        {pending ? "Submitting…" : "Submit Vote"}
      </button>
      <p aria-live="polite" className="mt-3 min-h-5 text-sm text-red-700">{message}</p>
    </Shell>
  );
}