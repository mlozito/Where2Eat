"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import DemoViewToggle from "../_components/DemoViewToggle";
import { findRestaurant, useDemoGroup } from "../_lib/demoGroup";

const SPIN_MS = 4500;
// Slices alternate dark and light so neighbors never match.
const darkColors = ["#ea580c", "#c2410c"];
const lightColors = ["#fdba74", "#fed7aa"];

function sliceColor(index: number, count: number) {
  // With an odd count the last slice would touch the first dark one.
  if (count > 1 && count % 2 === 1 && index === count - 1) return "#fcd34d";
  const colors = index % 2 === 0 ? darkColors : lightColors;
  return colors[Math.floor(index / 2) % 2];
}

// A point on the wheel's edge; angles are clockwise from the top.
function edgePoint(degrees: number, radius = 100) {
  const radians = (degrees * Math.PI) / 180;
  return [radius * Math.sin(radians), -radius * Math.cos(radians)];
}

function Wheel({ names }: { names: string[] }) {
  const slice = 360 / names.length;

  return (
    <svg viewBox="-105 -105 210 210" className="h-full w-full" aria-hidden="true">
      {names.map((name, index) => {
        const start = index * slice;
        const middle = start + slice / 2;
        const color = sliceColor(index, names.length);
        // Labels on the left half get flipped so they aren't upside down.
        const labelTransform =
          middle > 180
            ? `rotate(${middle + 90}) translate(-58 0)`
            : `rotate(${middle - 90}) translate(58 0)`;
        const [x1, y1] = edgePoint(start);
        const [x2, y2] = edgePoint(start + slice);
        const label = name.length > 16 ? `${name.slice(0, 15)}…` : name;

        return (
          <g key={index}>
            {names.length === 1 ? (
              <circle r="100" fill={color} />
            ) : (
              <path
                d={`M 0 0 L ${x1} ${y1} A 100 100 0 ${slice > 180 ? 1 : 0} 1 ${x2} ${y2} Z`}
                fill={color}
                stroke="white"
                strokeWidth="1.5"
              />
            )}
            <text
              transform={labelTransform}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="9"
              fontWeight="600"
              fill={darkColors.includes(color) ? "white" : "#7c2d12"}
            >
              {label}
            </text>
          </g>
        );
      })}
      <circle r="10" fill="white" stroke="#ea580c" strokeWidth="3" />
    </svg>
  );
}

export default function WheelPage() {
  const router = useRouter();
  const { group, loaded, update } = useDemoGroup();
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);

  if (!loaded) {
    return (
      <main className="min-h-screen bg-orange-50 px-4 py-10 text-stone-900">
        <p className="text-center text-lg font-medium">Loading...</p>
      </main>
    );
  }

  if (!group || (group.stage !== "spinning" && group.stage !== "done")) {
    return (
      <main className="min-h-screen bg-orange-50 px-4 py-10 text-stone-900">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-10 text-center shadow-sm">
          <h1 className="mb-3 text-2xl font-semibold">The wheel isn&apos;t ready</h1>
          <p className="mb-6 text-stone-600">The host hasn&apos;t chosen to spin.</p>
          <Link
            href={group ? "/waiting" : "/suggest"}
            className="inline-block rounded-xl bg-orange-600 px-6 py-3 font-semibold text-white hover:bg-orange-700"
          >
            {group ? "Back to the waiting room" : "Suggest a Restaurant"}
          </Link>
        </div>
      </main>
    );
  }

  const names = group.wheelOptions.map((id) => findRestaurant(group, id)?.name ?? "?");
  const winner = group.result ? findRestaurant(group, group.result.restaurantId) : null;
  const isHost = !group.viewAsGuest;

  function spin() {
    const options = group!.wheelOptions;
    const index = Math.floor(Math.random() * options.length);
    const slice = 360 / options.length;
    // Turn until the middle of the winning slice sits under the pointer at the top.
    const target = 360 - (index + 0.5) * slice;
    const extra = (target - (rotation % 360) + 360) % 360;

    setRotation(rotation + 5 * 360 + extra);
    setSpinning(true);
    setTimeout(() => {
      setSpinning(false);
      update((current) => ({
        ...current,
        stage: "done",
        result: {
          restaurantId: options[index],
          method: current.isTieBreak ? "TIE_RANDOM" : "RANDOM",
        },
      }));
    }, SPIN_MS);
  }

  return (
    <main className="min-h-screen bg-orange-50 px-4 py-10 text-stone-900">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-orange-600">
            Where2Eat / Spin the wheel
          </p>
          <h1 className="mt-3 text-4xl font-bold">
            {group.isTieBreak ? "It's a tie!" : "Feeling lucky?"}
          </h1>
          <p className="mt-3 text-stone-600">
            {group.isTieBreak
              ? "The vote was tied, so the wheel breaks it."
              : group.optionsNote}
          </p>
        </header>

        <div className="relative mx-auto aspect-square w-full max-w-sm">
          <div
            aria-hidden="true"
            className="absolute -top-1 left-1/2 z-10 h-0 w-0 -translate-x-1/2 border-x-[14px] border-t-[24px] border-x-transparent border-t-stone-800"
          />
          <div
            className="h-full w-full rounded-full shadow-lg"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: `transform ${SPIN_MS}ms cubic-bezier(0.17, 0.67, 0.21, 1)`,
            }}
          >
            <Wheel names={names} />
          </div>
        </div>

        <div className="mt-8 space-y-6 text-center">
          {winner && !spinning ? (
            <div className="rounded-2xl bg-white p-6 shadow-sm" role="status">
              <p className="text-sm font-semibold uppercase tracking-widest text-orange-600">
                The wheel has spoken
              </p>
              <p className="mt-2 text-3xl font-bold">{winner.name}</p>
              <button
                type="button"
                onClick={() => router.push("/result")}
                className="mt-5 rounded-xl bg-orange-600 px-6 py-3 font-semibold text-white hover:bg-orange-700"
              >
                See the result →
              </button>
            </div>
          ) : isHost ? (
            <button
              type="button"
              disabled={spinning}
              onClick={spin}
              className="w-full rounded-xl bg-orange-600 px-6 py-4 text-lg font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              {spinning ? "Spinning…" : "Spin! 🎡"}
            </button>
          ) : (
            <p className="rounded-2xl bg-white p-6 text-lg font-medium shadow-sm">
              Waiting for the host to spin…
            </p>
          )}

          {!winner && (
            <DemoViewToggle
              viewAsGuest={group.viewAsGuest}
              onChange={(viewAsGuest) => update((current) => ({ ...current, viewAsGuest }))}
            />
          )}
        </div>
      </div>
    </main>
  );
}
