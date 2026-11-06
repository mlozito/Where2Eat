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
    `rounded-xl border px-4 py-3 text-left transition ${
      selected
        ? "border-orange-500 bg-orange-500 text-white"
        : disabled
          ? "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400"
          : "border-stone-300 bg-white hover:bg-orange-50"
    }`;

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="mb-1 text-xl font-semibold">Set up the group</h2>
      <p className="mb-5 text-sm text-stone-500">
        Only the host sees this. Once you start, these choices are locked in.
      </p>

      <div className="space-y-6">
        <div>
          <p className="mb-2 text-sm font-medium">How should restaurants be chosen?</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" aria-pressed={model === "SUGGESTION"} className={choice(model === "SUGGESTION")} onClick={() => chooseModel("SUGGESTION")}>
              <span className="block font-semibold">Suggestions</span>
              <span className="block text-sm opacity-90">Everyone adds their own pick</span>
            </button>
            <button type="button" aria-pressed={model === "PREFERENCE"} className={choice(model === "PREFERENCE")} onClick={() => chooseModel("PREFERENCE")}>
              <span className="block font-semibold">Preferences</span>
              <span className="block text-sm opacity-90">We select top restaurants from everyone's input</span>
            </button>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">How should the final choice be made?</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <button type="button" aria-pressed={decisionType === "VOTE"} className={choice(decisionType === "VOTE")} onClick={() => setDecisionType("VOTE")}>
              <span className="block font-semibold">Anonymous vote</span>
            </button>
            <button type="button" aria-pressed={decisionType === "RANDOM"} className={choice(decisionType === "RANDOM")} onClick={() => setDecisionType("RANDOM")}>
              <span className="block font-semibold">Random</span>
            </button>
            <button
              type="button"
              aria-pressed={decisionType === "BEST_FIT"}
              disabled={model !== "PREFERENCE"}
              title={model !== "PREFERENCE" ? "Only available with preferences" : undefined}
              className={choice(decisionType === "BEST_FIT", model !== "PREFERENCE")}
              onClick={() => setDecisionType("BEST_FIT")}
            >
              <span className="block font-semibold">Best fit</span>
            </button>
          </div>
        </div>

        {model === "PREFERENCE" && (
          <div>
            <label htmlFor="location" className="mb-2 block text-sm font-medium">
              Where should we search?
            </label>
            <input
              id="location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              maxLength={100}
              placeholder="City or ZIP code"
              className="w-full rounded-full border border-stone-300 px-4 py-3 focus:border-orange-600 focus:outline-none"
            />
          </div>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="w-full rounded-full bg-orange-500 px-8 py-4 font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-neutral-300"
        >
          {pending ? "Starting…" : "Start"}
        </button>

        <p aria-live="polite" className="min-h-5 text-sm text-red-700">
          {message === "Starting…" ? "" : message}
        </p>
      </div>
    </section>
  );
}