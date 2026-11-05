import { Suspense } from "react";
import LobbyRoom from "./lobbyRoom";

type SearchParams = Promise<{ group?: string }>;

export default function LobbyPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<p className="rounded-2xl bg-white p-6 text-stone-500 shadow-sm">Loading…</p>}>
      <LobbyContent searchParams={searchParams} />
    </Suspense>
  );
}

async function LobbyContent({ searchParams }: { searchParams: SearchParams }) {
  const { group } = await searchParams;
  if (!group) return <p className="p-6">No group selected.</p>;
  return <LobbyRoom groupId={group} />;
}