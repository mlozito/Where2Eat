"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { joinGroup } from "./actions";

export default function JoinGroup() {
    const router = useRouter();
    const [groupCode, setGroupCode] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleJoin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const result = await joinGroup({
      joinCode: groupCode,
      displayName: displayName,
    });


    if (result.error || !result.groupId) {
      setError(result.error ?? "Couldn't join with that code.");
      setLoading(false);
      return;
    }

    router.push(`/lobby?group=${result.groupId}`);
  
  }

  return (
    <main className="min-h-screen bg-orange-50 text-neutral-900">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-6 md:px-12">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          Where2Eat
        </Link>

        <Link
          href="/"
          className="rounded-full border border-orange-200 px-5 py-2.5 font-medium transition hover:bg-orange-100"
        >
          Back to Home
        </Link>
      </nav>

      {/* Join Group Form */}
      <section className="mx-auto flex max-w-6xl justify-center px-6">
        <div className="w-full max-w-xl rounded-3xl border border-orange-100 bg-white p-8 shadow-sm md:p-10">
          <div className="text-center">

            <h1 className="mt-3 text-4xl font-bold">
              Join a Group
            </h1>

            <p className="mt-4 leading-7 text-neutral-600">
              Have a group code? Enter it below and let&apos;s figure out where
              to eat together.
            </p>
          </div>

          <form onSubmit={handleJoin} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="groupCode"
                className="mb-2 block font-semibold"
              >
                Group Code
              </label>

              <input
                id="groupCode"
                type="text"
                value={groupCode}
                onChange={(event) =>
                  setGroupCode(event.target.value.toUpperCase())
                }
                maxLength={6}
                placeholder="Enter 6-character code"
                required
                className="w-full rounded-full border border-orange-200 px-5 py-3 uppercase tracking-widest outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div>
              <label
                htmlFor="displayName"
                className="mb-2 block font-semibold"
              >
                Your Name
              </label>

              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                maxLength={40}
                placeholder="Enter your name"
                required
                className="w-full rounded-full border border-orange-200 px-5 py-3 outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || groupCode.length !== 6 || !displayName.trim()}
              className="w-full rounded-full bg-orange-500 px-8 py-4 font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              {loading ? "Joining..." : "Join Group →"}
            </button>
          </form>
        </div>
      </section>
      {/* Footer */}
      <footer className="border-t border-orange-100 px-6 py-6 text-center text-sm text-neutral-500">
      </footer>
    </main>
  );
}

/*make sure to double check the quick join at the bottom of the page*/