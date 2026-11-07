"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loading, Shell } from "../_components/shell";
import { asSnapshot } from "../_components/restaurantCard";
import { withGroup } from "../_lib/groupRoutes";
import { useGroupStage } from "../_lib/useGroupStage";

// server chooses winner, then shuffles for suspense
const TICKS = 24;

export default function RandomRoom({ groupId }: { groupId: string }) {
  const { lobby, error, ready } = useGroupStage(groupId);
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);

  const names = (lobby?.options ?? []).map((o) => asSnapshot(o.snapshot).name ?? "?");
  const winnerIndex = lobby?.result
    ? Math.max(0, lobby.options.findIndex((o) => o.candidateId === lobby.result!.candidateId))
    : 0;

  useEffect(() => {
    if (!ready || done || names.length === 0) return;

    const start = (winnerIndex - TICKS) % names.length;
    let step = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      step += 1;
      setIndex((((start + step) % names.length) + names.length) % names.length);
      if (step >= TICKS) {
        setDone(true);
        return;
      }
      timer = setTimeout(tick, 60 + step * step * 1.2);
    };
    timer = setTimeout(tick, 300);
    return () => clearTimeout(timer);
  }, [ready, done, names.length, winnerIndex]);

  if (error) return <Shell><p className="rounded-2xl bg-white p-6 shadow-sm">{error}</p></Shell>;
  if (!lobby || !ready) return <Loading />;

  const tieBreak = lobby.result?.method === "TIE_RANDOM";

  return (
    <Shell>
      <header className="mb-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-orange-600">
          {tieBreak ? "Tie-breaker" : "Random pick"}
        </p>
        <h1 className="mt-3 text-4xl font-bold">{done ? "And the winner is…" : "Picking a restaurant…"}</h1>
      </header>

      <div
        aria-live="polite"
        className={`rounded-3xl p-10 text-center shadow-sm transition ${
          done ? "scale-105 bg-orange-500 text-white" : "bg-white"
        }`}
      >
        <p className="text-3xl font-bold">{names[index] ?? "…"}</p>
      </div>

      <ul className="mt-6 flex flex-wrap justify-center gap-2" aria-hidden="true">
        {names.map((n, i) => (
          <li
            key={`${n}-${i}`}
            className={`rounded-lg px-3 py-1 text-sm transition ${
              i === index ? "bg-orange-500 text-white" : "bg-white text-stone-600"
            }`}
          >
            {n}
          </li>
        ))}
      </ul>

      {done && (
        <div className="mt-8 text-center">
          <Link
            href={withGroup("/result", groupId)}
            className="inline-block rounded-full bg-orange-500 px-8 py-4 text-lg font-semibold text-white hover:bg-orange-600"
          >
            See Details
          </Link>
        </div>
      )}
    </Shell>
  );
}