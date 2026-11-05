"use client";

import { useState, useTransition } from "react";
import { configureGroupAction } from "./actions";

const MESSAGES: Record<string, string> = {
  NOT_MEMBER: "You're not in this group.",
  NOT_FOUND: "That group doesn't exist.",
  NOT_HOST: "Only the host can start the group.",
  WRONG_STATE: "This group has already been started.",
  INVALID_COMBINATION: "Best fit is only available with preferences.",
  LOCATION_REQUIRED: "Enter a location for preference mode.",
  INVALID: "Please check your choices.",
};

type Model = "SUGGESTION" | "PREFERENCE";
type DecisionType = "VOTE" | "RANDOM" | "BEST_FIT";

export default function HostSettings({ groupId }: { groupId: string }) {
  const [model, setModel] = useState<Model>("SUGGESTION");
  const [decisionType, setDecisionType] = useState<DecisionType>("VOTE");
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function chooseModel(next: Model) {
    setModel(next);
    if (next === "SUGGESTION" && decisionType === "BEST_FIT") setDecisionType("VOTE");
    setMessage("");
  }

  function submit() {
    setMessage("");
    startTransition(async () => {
      const result = await configureGroupAction(groupId, {
        model,
        decisionType,
        location: model === "PREFERENCE" ? location : undefined,
      });
      if (!result.ok) {
        setMessage(("message" in result && result.message) || MESSAGES[result.error] || "Something went wrong.");
      } else {
        setMessage("Starting…"); // the polling will move everyone along
      }
    });
  }

  const choice = (selected: boolean, disabled = false) =>
    `rounded-xl border px-4 py-3 text-left text-sm transition ${
      selected
        ? "border-orange-600 bg-orange-600 text-white"
        : disabled
          ? "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400"
          : "border-stone-300 bg-white hover:bg-orange-50"
    }`;

  return (
    <div className="mt-6 space-y-5 border-t border-stone-200 pt-6">
      <h2 className="text-lg font-semibold">Set up the group</h2>

      <div>
        <p className="mb-2 text-sm text-stone-600">How should restaurants be chosen?</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <button type="button" aria-pressed={model === "SUGGESTION"} className={choice(model === "SUGGESTION")} onClick={() => chooseModel("SUGGESTION")}>
            Everyone suggests restaurants
          </button>
          <button type="button" aria-pressed={model === "PREFERENCE"} className={choice(model === "PREFERENCE")} onClick={() => chooseModel("PREFERENCE")}>
            Pick from everyone's preferences
          </button>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm text-stone-600">How should the final choice be made?</p>
        <div className="grid gap-2 sm:grid-cols-3">
          <button type="button" aria-pressed={decisionType === "VOTE"} className={choice(decisionType === "VOTE")} onClick={() => setDecisionType("VOTE")}>
            Anonymous vote
          </button>
          <button type="button" aria-pressed={decisionType === "RANDOM"} className={choice(decisionType === "RANDOM")} onClick={() => setDecisionType("RANDOM")}>
            Random pick
          </button>
          <button
            type="button"
            aria-pressed={decisionType === "BEST_FIT"}
            disabled={model !== "PREFERENCE"}
            title={model !== "PREFERENCE" ? "Only available with preferences" : undefined}
            className={choice(decisionType === "BEST_FIT", model !== "PREFERENCE")}
            onClick={() => setDecisionType("BEST_FIT")}
          >
            Best fit
          </button>
        </div>
      </div>

      {model === "PREFERENCE" && (
        <div>
          <label htmlFor="location" className="mb-2 block text-sm text-stone-600">
            Where should we search? (city or ZIP code)
          </label>
          <input
            id="location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            maxLength={100}
            className="w-full rounded-xl border border-stone-300 px-4 py-2"
          />
        </div>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="rounded-full bg-orange-600 px-6 py-2 text-white transition hover:bg-orange-700 disabled:opacity-60"
      >
        {pending ? "Starting…" : "Start"}
      </button>

      <p aria-live="polite" className="min-h-5 text-sm text-stone-600">{message}</p>
    </div>
  );
}