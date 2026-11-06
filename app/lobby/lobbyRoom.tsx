"use client";

import { useGroupStage } from "../_lib/useGroupStage";
import HostSettings from "./hostSettings";

export default function LobbyRoom({ groupId }: { groupId: string }) {
  // moves all members to the right page as soon as the host starts the group
  const { lobby, error, reconnecting, ready } = useGroupStage(groupId);

  if (error) {
    return <p className="rounded-2xl bg-white p-6 text-stone-700 shadow-sm">{error}</p>;
  }
  if (!lobby || !ready) {
    return <p className="rounded-2xl bg-white p-6 text-stone-500 shadow-sm">Loading…</p>;
  }

  const count = lobby.members.length;

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h1 className="mb-2 text-2xl font-semibold">Lobby</h1>

      <p className="mb-5 text-sm text-stone-500">
        Share this code to invite people:{" "}
        <span className="rounded-md bg-stone-100 px-2 py-1 font-mono text-base tracking-widest text-stone-800">
          {lobby.inviteCode}
        </span>
      </p>

      <ul aria-live="polite" className="mb-4 space-y-2">
        {lobby.members.map((member) => (
          <li key={member.id} className="flex items-center gap-2 rounded-xl border border-stone-200 px-4 py-3">
            <span>{member.displayName}</span>
            {member.isHost && (
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-800">Host</span>
            )}
            {member.id === lobby.youId && <span className="text-xs text-stone-500">(you)</span>}
          </li>
        ))}
      </ul>

      <p className="text-sm text-stone-600">
        {count} {count === 1 ? "person" : "people"} here.
        {!lobby.youAreHost && " Waiting for the host to start…"}
      </p>

      {lobby.youAreHost && lobby.status === "LOBBY" && <HostSettings groupId={groupId} />}

      {reconnecting && <p className="mt-2 text-sm text-amber-700">Connection lost. Reconnecting…</p>}
    </section>
  );
}