import Link from "next/link";
import { Suspense } from "react";
import LobbyRoom from "./lobbyRoom";

type SearchParams = Promise<{ group?: string }>;

export default function LobbyPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="min-h-screen bg-orange-50 px-4 py-10 text-stone-900">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-orange-600">
            Lobby
          </p>
          <h1 className="mt-3 text-4xl font-bold">Get your group together</h1>
          <p className="mt-3 text-stone-600">
            Share the invite code and wait for everyone to join.
          </p>
        </header>

        <Suspense fallback={<p className="text-center text-lg font-medium">Loading...</p>}>
          <LobbyContent searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function LobbyContent({ searchParams }: { searchParams: SearchParams }) {
  const { group } = await searchParams;

  if (!group) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        <h2 className="mb-3 text-2xl font-semibold">You&apos;re not in a group yet</h2>
        <p className="mb-6 text-stone-600">Start a new group or join one with an invite code.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/create-group"
            className="inline-block rounded-xl bg-orange-600 px-6 py-3 font-semibold text-white hover:bg-orange-700"
          >
            Create a group
          </Link>
          <Link
            href="/join"
            className="inline-block rounded-xl border border-orange-600 px-6 py-3 font-semibold text-orange-700 hover:bg-orange-100"
          >
            Join a group
          </Link>
        </div>
      </div>
    );
  }

  return <LobbyRoom groupId={group} />;
}