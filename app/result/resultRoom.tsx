"use client";

import Link from "next/link";
import { Loading, Shell } from "../_components/shell";
import RestaurantCard, { asSnapshot, mapsUrl } from "../_components/restaurantCard";
import { useGroupStage } from "../_lib/useGroupStage";

const HOW_CHOSEN: Record<string, string> = {
  VOTE: "Chosen by your group's vote",
  RANDOM: "Picked at random",
  TIE_RANDOM: "The vote tied, so it was picked at random",
  BEST_FIT: "The best match for everyone's preferences",
};

// result room displays the final result to the group
export default function ResultRoom({ groupId }: { groupId: string }) {
  const { lobby, error, ready } = useGroupStage(groupId);

  if (error) return <Shell><p className="rounded-2xl bg-white p-6 shadow-sm">{error}</p></Shell>;
  if (!lobby || !ready || !lobby.result) return <Loading />;

  const { candidateId, method } = lobby.result;
  const winner = lobby.options.find((o) => o.candidateId === candidateId);
  const snapshot = asSnapshot(winner?.snapshot);
  const matchScore = method === "BEST_FIT" && snapshot.matchScore ? Math.round(snapshot.matchScore * 100) : null;

  return (
    <Shell>
      <header className="mb-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-orange-600">You&apos;re eating at</p>
        <h1 className="mt-3 text-5xl font-bold">{snapshot.name ?? "…"}</h1>
        <p className="mt-3 text-stone-600">{HOW_CHOSEN[method] ?? "Decided"}</p>
      </header>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <RestaurantCard snapshot={snapshot} />
        {matchScore !== null && (
          <p className="mt-4 text-sm font-medium text-green-700">{matchScore}% match with your group</p>
        )}
        <a
          href={mapsUrl(snapshot)}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-block rounded-full bg-orange-500 px-6 py-3 font-semibold text-white hover:bg-orange-600"
        >
          Open in Maps
        </a>
      </section>

      <div className="mt-6 text-center">
        <Link href="/" className="text-sm font-medium text-orange-700 underline hover:text-orange-900">
          Start a new group
        </Link>
      </div>
    </Shell>
  );
}