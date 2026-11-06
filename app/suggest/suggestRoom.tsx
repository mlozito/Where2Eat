"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loading, Shell } from "../_components/shell";
import { asSnapshot } from "../_components/restaurantCard";
import { withGroup } from "../_lib/groupRoutes";
import { useGroupStage } from "../_lib/useGroupStage";
import { addSuggestionAction } from "./actions";

const MESSAGES: Record<string, string> = {
  NOT_MEMBER: "You're not in this group.",
  NOT_FOUND: "That group doesn't exist.",
  WRONG_STATE: "Suggestions are closed.",
  LIMIT_REACHED: "You've already suggested a restaurant.",
  DUPLICATE: "Someone already suggested that one. Try another!",
};

export default function SuggestRoom({ groupId }: { groupId: string }) {
  const router = useRouter();
  const { lobby, error, ready } = useGroupStage(groupId);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  if (error) return <Shell><p className="rounded-2xl bg-white p-6 shadow-sm">{error}</p></Shell>;
  if (!lobby || !ready) return <Loading />;

  const suggestions = lobby.options.map((o) => asSnapshot(o.snapshot).name).filter(Boolean);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    startTransition(async () => {
      const result = await addSuggestionAction(groupId, { name, address });
      if (result.ok) {
        router.push(withGroup("/waiting", groupId));
        return;
      }
      setMessage(("message" in result && result.message) || MESSAGES[result.error] || "Something went wrong.");
    });
  }

  return (
    <Shell>
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-orange-600">
          Suggestion mode · {lobby.decisionType === "RANDOM" ? "Random pick" : "Anonymous vote"}
        </p>
        <h1 className="mt-3 text-4xl font-bold">Where do you want to eat?</h1>
        <p className="mt-3 text-stone-600">
          Suggest one restaurant.{" "}
          {lobby.decisionType === "RANDOM"
            ? "Once everyone's in, one suggestion gets picked at random."
            : "Once everyone's in, the group votes anonymously."}
        </p>
      </header>

      <form onSubmit={submit} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <label className="block">
          <span className="mb-2 block text-sm font-medium">Restaurant name</span>
          <input
            value={name}
            onChange={(e) => { setName(e.target.value); setMessage(""); }}
            maxLength={100}
            required
            className="w-full rounded-xl border border-stone-300 px-4 py-2"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium">
            Address or area <span className="font-normal text-stone-400">(optional)</span>
          </span>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            maxLength={200}
            className="w-full rounded-xl border border-stone-300 px-4 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={pending || !name.trim()}
          className="w-full rounded-xl bg-orange-600 px-6 py-3 font-semibold text-white transition hover:bg-orange-700 disabled:bg-stone-300"
        >
          {pending ? "Submitting…" : "Submit suggestion"}
        </button>
        <p aria-live="polite" className="min-h-5 text-sm text-red-700">{message}</p>
      </form>

      {suggestions.length > 0 && (
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Already suggested</h2>
          <ul className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <li key={s} className="rounded-lg bg-orange-50 px-3 py-1 text-sm">{s}</li>
            ))}
          </ul>
        </section>
      )}
    </Shell>
  );
}