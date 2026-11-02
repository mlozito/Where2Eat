"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import DemoViewToggle from "../_components/DemoViewToggle";
import RestaurantDetails from "../_components/RestaurantDetails";
import {
  activeMembers,
  findRestaurant,
  hasSuggested,
  hasVoted,
  type Member,
  pickOptions,
  pretendVote,
  tallyVotes,
  useDemoGroup,
} from "../_lib/demoGroup";

export default function WaitingPage() {
  const router = useRouter();
  const { group, loaded, now, update } = useDemoGroup();
  const [confirmingSkip, setConfirmingSkip] = useState(false);

  if (!loaded) {
    return (
      <main className="min-h-screen bg-orange-50 px-4 py-10 text-stone-900">
        <p className="text-center text-lg font-medium">Loading...</p>
      </main>
    );
  }

  if (!group) {
    return (
      <main className="min-h-screen bg-orange-50 px-4 py-10 text-stone-900">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-10 text-center shadow-sm">
          <h1 className="mb-3 text-2xl font-semibold">You&apos;re not in a group yet</h1>
          <p className="mb-6 text-stone-600">Start from the preferences page.</p>
          <Link
            href="/preferences"
            className="inline-block rounded-xl bg-orange-600 px-6 py-3 font-semibold text-white hover:bg-orange-700"
          >
            Set Preferences
          </Link>
        </div>
      </main>
    );
  }

  const isVoting = group.stage === "voting";
  const isHost = !group.viewAsGuest;
  const me = group.members.find((member) => member.id === group.meId)!;
  const isDone = (member: Member) =>
    isVoting ? hasVoted(group, member, now) : hasSuggested(group, member, now);

  const active = activeMembers(group);
  const doneCount = active.filter(isDone).length;
  const allDone = doneCount === active.length;
  // The host can move on without people who are taking too long, but not without themself.
  const stragglers = active.filter((member) => !isDone(member) && member.id !== group.meId);
  const iStillNeedToVote = isVoting && me.vote === null;
  const preview = !isVoting && allDone ? pickOptions(group) : null;

  function skipStragglers() {
    const ids = stragglers.map((member) => member.id);
    update((current) => ({
      ...current,
      members: current.members.map((member) =>
        ids.includes(member.id) ? { ...member, skipped: true } : member,
      ),
    }));
    setConfirmingSkip(false);
  }

  function startWheel() {
    update((current) => {
      const { options, note } = pickOptions(current);
      return {
        ...current,
        stage: "spinning",
        options,
        optionsNote: note,
        wheelOptions: options,
        isTieBreak: false,
      };
    });
    router.push("/wheel");
  }

  function startVoting() {
    update((current) => {
      const { options, note } = pickOptions(current);
      const withOptions = { ...current, options, optionsNote: note };
      return {
        ...withOptions,
        stage: "voting",
        voteStartedAt: Date.now(),
        members: current.members.map((member) => ({
          ...member,
          vote: member.id === current.meId ? null : pretendVote(withOptions, member),
        })),
      };
    });
    router.push("/vote");
  }

  function revealResults() {
    const counts = tallyVotes(group!);
    const most = Math.max(...counts.values());
    const leaders = group!.options.filter((id) => counts.get(id) === most);

    if (leaders.length === 1) {
      update((current) => ({
        ...current,
        stage: "done",
        result: { restaurantId: leaders[0], method: "VOTE" },
      }));
      router.push("/result");
    } else {
      update((current) => ({
        ...current,
        stage: "spinning",
        wheelOptions: leaders,
        isTieBreak: true,
      }));
      router.push("/wheel");
    }
  }

  function statusText(member: Member) {
    if (member.skipped) return "Skipped";
    if (isVoting) return isDone(member) ? "Voted ✓" : "Still voting…";
    return isDone(member) ? `Picked ${member.suggestion?.name} ✓` : "Still choosing…";
  }

  return (
    <main className="min-h-screen bg-orange-50 px-4 py-10 text-stone-900">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-orange-600">
            Where2Eat / Waiting room
          </p>
          <h1 className="mt-3 text-4xl font-bold">
            {isVoting ? "Waiting for everyone to vote" : "Waiting for everyone to pick"}
          </h1>
          <p className="mt-3 text-stone-600">
            {doneCount} of {active.length} ready
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-orange-100">
            <div
              className="h-full rounded-full bg-orange-600 transition-all"
              style={{ width: `${(doneCount / active.length) * 100}%` }}
            />
          </div>
        </header>

        {group.stage === "spinning" || group.stage === "done" ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <h2 className="mb-6 text-2xl font-semibold">The group has moved on</h2>
            <Link
              href={group.stage === "spinning" ? "/wheel" : "/result"}
              className="inline-block rounded-xl bg-orange-600 px-6 py-3 font-semibold text-white hover:bg-orange-700"
            >
              {group.stage === "spinning" ? "Go to the wheel" : "See the result"}
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {iStillNeedToVote && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-orange-100 p-6">
                <p className="font-medium">You haven&apos;t voted yet.</p>
                <Link
                  href="/vote"
                  className="rounded-xl bg-orange-600 px-5 py-2 font-semibold text-white hover:bg-orange-700"
                >
                  Vote now
                </Link>
              </div>
            )}

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">Your group</h2>
              <ul className="divide-y divide-stone-100">
                {group.members.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center justify-between gap-4 py-3"
                  >
                    <span className="font-medium">
                      {member.name}
                      {member.isHost && (
                        <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-800">
                          Host
                        </span>
                      )}
                    </span>
                    <span
                      className={`text-right text-sm ${
                        member.skipped
                          ? "text-stone-400"
                          : isDone(member)
                            ? "font-medium text-green-700"
                            : "text-stone-500"
                      }`}
                    >
                      {statusText(member)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {preview && (
              <section className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="mb-1 text-xl font-semibold">In the running</h2>
                <p className="mb-4 text-sm text-stone-500">{preview.note}</p>
                <ul className="space-y-3">
                  {preview.options.map((id) => {
                    const restaurant = findRestaurant(group, id)!;
                    return (
                      <li key={id} className="rounded-xl border border-orange-100 p-4">
                        <p className="mb-2 font-semibold">{restaurant.name}</p>
                        <RestaurantDetails restaurant={restaurant} />
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {isHost ? (
              <section className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="mb-1 text-xl font-semibold">Host controls</h2>
                <p className="mb-5 text-sm text-stone-500">
                  {allDone
                    ? "Everyone's ready!"
                    : "You can continue once everyone is ready."}
                </p>

                {isVoting ? (
                  <button
                    type="button"
                    disabled={!allDone}
                    onClick={revealResults}
                    className="w-full rounded-xl bg-orange-600 px-6 py-4 text-lg font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-stone-300"
                  >
                    Reveal the Results →
                  </button>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      disabled={!allDone}
                      onClick={startWheel}
                      className="rounded-xl bg-orange-600 px-6 py-4 text-left text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-stone-300"
                    >
                      <span className="block text-lg font-semibold">🎡 Spin the wheel</span>
                      <span className="block text-sm opacity-90">Let luck decide</span>
                    </button>
                    <button
                      type="button"
                      disabled={!allDone}
                      onClick={startVoting}
                      className="rounded-xl bg-orange-600 px-6 py-4 text-left text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-stone-300"
                    >
                      <span className="block text-lg font-semibold">🗳️ Vote</span>
                      <span className="block text-sm opacity-90">Everyone picks a favorite</span>
                    </button>
                  </div>
                )}

                {stragglers.length > 0 &&
                  (confirmingSkip ? (
                    <div className="mt-5 rounded-xl bg-orange-50 p-4">
                      <p className="mb-3 text-sm">
                        Continue without{" "}
                        {stragglers.map((member) => member.name).join(", ")}?{" "}
                        {isVoting
                          ? "Their votes won't count."
                          : "Their picks and preferences won't be included."}
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={skipStragglers}
                          className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
                        >
                          Yes, continue without them
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingSkip(false)}
                          className="rounded-lg px-4 py-2 text-sm font-medium text-stone-600 hover:bg-white"
                        >
                          Keep waiting
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmingSkip(true)}
                      className="mt-5 text-sm font-medium text-orange-700 underline hover:text-orange-900"
                    >
                      Taking too long? Continue without{" "}
                      {stragglers.map((member) => member.name).join(", ")}
                    </button>
                  ))}
              </section>
            ) : (
              <section className="rounded-2xl bg-white p-6 text-center shadow-sm">
                <p className="text-lg font-medium">
                  {allDone
                    ? "Everyone's ready! Waiting for the host to continue…"
                    : "Hang tight while everyone finishes."}
                </p>
              </section>
            )}

            <DemoViewToggle
              viewAsGuest={group.viewAsGuest}
              onChange={(viewAsGuest) => update((current) => ({ ...current, viewAsGuest }))}
            />
          </div>
        )}
      </div>
    </main>
  );
}
