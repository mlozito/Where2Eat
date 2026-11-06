"use client";

import Link from "next/link";
import { useState } from "react";
import { useGroupStage } from "../_lib/useGroupStage";
import HostSettings from "./hostSettings";

export default function LobbyRoom({ groupId }: { groupId: string }) {
  // moves all members to the right page as soon as the host starts the group
  const { lobby, error, reconnecting, ready } = useGroupStage(groupId);
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    if (!lobby) return;
    try {
      await navigator.clipboard.writeText(lobby.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the code is still on screen to read out.
    }
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        <h2 className="mb-6 text-2xl font-semibold">{error}</h2>
        <Link
          href="/join"
          className="inline-block rounded-xl bg-orange-600 px-6 py-3 font-semibold text-white hover:bg-orange-700"
        >
          Join a group
        </Link>
      </div>
    );
  }
  if (!lobby || !ready) {
    return <p className="text-center text-lg font-medium">Loading...</p>;
  }

  const count = lobby.members.length;

  return (
    <div className="space-y-6">
      {reconnecting && (
        <div className="rounded-2xl bg-orange-100 p-4 text-sm font-medium text-orange-900">
          Connection lost. Reconnecting…
        </div>
      )}

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-xl font-semibold">Invite code</h2>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-xl bg-orange-50 px-5 py-3 text-2xl font-bold tracking-[0.3em] text-orange-600">
            {lobby.inviteCode}
          </span>
          <button
            type="button"
            onClick={copyCode}
            className="rounded-full border border-orange-200 px-4 py-2 text-center font-semibold transition hover:bg-orange-100"
          >
            {copied ? "Copied ✓" : "Copy"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-xl font-semibold">Your group</h2>
        <p className="mb-4 text-sm text-stone-500">
          {count} {count === 1 ? "person" : "people"} here
        </p>
        <ul aria-live="polite" className="divide-y divide-stone-100">
          {lobby.members.map((member) => (
            <li key={member.id} className="flex items-center justify-between gap-4 py-3">
              <span className="font-medium">
                {member.displayName}
                {member.isHost && (
                  <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-800">
                    Host
                  </span>
                )}
              </span>
              {member.id === lobby.youId && <span className="text-sm text-stone-500">You</span>}
            </li>
          ))}
        </ul>
      </section>

      {lobby.youAreHost && lobby.status === "LOBBY" ? (
        <HostSettings groupId={groupId} />
      ) : (
        <section className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="text-lg font-medium">Waiting for the host to start…</p>
        </section>
      )}
    </div>
  );
}