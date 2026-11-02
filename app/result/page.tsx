"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import RestaurantDetails from "../_components/RestaurantDetails";
import { findRestaurant, tallyVotes, useDemoGroup } from "../_lib/demoGroup";

const methodText = {
  VOTE: "Chosen by the group's vote",
  RANDOM: "Chosen by the wheel",
  TIE_RANDOM: "The vote was tied, so the wheel broke it",
};

export default function ResultPage() {
  const router = useRouter();
  const { group, loaded, replace } = useDemoGroup();

  if (!loaded) {
    return (
      <main className="min-h-screen bg-orange-50 px-4 py-10 text-stone-900">
        <p className="text-center text-lg font-medium">Loading...</p>
      </main>
    );
  }

  const winner = group?.result ? findRestaurant(group, group.result.restaurantId) : null;

  if (!group?.result || !winner) {
    return (
      <main className="min-h-screen bg-orange-50 px-4 py-10 text-stone-900">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-10 text-center shadow-sm">
          <h1 className="mb-3 text-2xl font-semibold">No decision yet</h1>
          <p className="mb-6 text-stone-600">The group is still deciding.</p>
          <Link
            href={group ? "/waiting" : "/preferences"}
            className="inline-block rounded-xl bg-orange-600 px-6 py-3 font-semibold text-white hover:bg-orange-700"
          >
            {group ? "Back to the waiting room" : "Set Preferences"}
          </Link>
        </div>
      </main>
    );
  }

  const showVotes = group.result.method !== "RANDOM";
  const counts = tallyVotes(group);

  function startOver() {
    replace(null);
    router.push("/preferences");
  }

  return (
    <main className="min-h-screen bg-orange-50 px-4 py-10 text-stone-900">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-orange-600">
            Where2Eat / Result
          </p>
          <h1 className="mt-3 text-4xl font-bold">You&apos;re eating at…</h1>
        </header>

        <section className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="text-4xl font-bold text-orange-700">{winner.name}</p>
          <p className="mb-5 mt-2 text-stone-500">{methodText[group.result.method]}</p>
          <div className="flex justify-center">
            <RestaurantDetails restaurant={winner} />
          </div>
        </section>

        {showVotes && (
          <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">How everyone voted</h2>
            <ul className="space-y-2">
              {group.options.map((id) => (
                <li key={id} className="flex justify-between">
                  <span>{findRestaurant(group, id)?.name}</span>
                  <span className="font-semibold">
                    {counts.get(id)} vote{counts.get(id) === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <button
          type="button"
          onClick={startOver}
          className="mt-6 w-full rounded-xl border-2 border-orange-600 px-6 py-4 text-lg font-semibold text-orange-700 transition hover:bg-orange-100"
        >
          Start Over
        </button>
      </div>
    </main>
  );
}
