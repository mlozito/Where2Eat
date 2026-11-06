"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createGroup } from "./actions";

export default function CreateGroup() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [groupId, setGroupId] = useState("");
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the code is still on screen to read out.
    }
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const result = await createGroup({
      displayName: displayName,
    });

    if (result.error || !result.inviteCode) {
      setError(result.error || "Couldn't create your group. Please try again.");
      setLoading(false);
      return;
    }

    setInviteCode(result.inviteCode);
    setGroupId(result.groupId);
    setLoading(false);
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

      {/* Create Group Form */}
      <section className="mx-auto flex max-w-6xl justify-center px-6">
        <div className="w-full max-w-xl rounded-3xl border border-orange-100 bg-white p-8 shadow-sm md:p-10">
          {!inviteCode ? (
            <>
              <div className="text-center">

                <h1 className="mt-3 text-4xl font-bold">
                  Create a Group
                </h1>

                <p className="mt-4 leading-7 text-neutral-600">
                  Start a group, invite your friends, and decide where everyone
                  wants to eat!
                </p>
              </div>

              <form onSubmit={handleCreate} className="mt-8 space-y-5">
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
                  disabled={loading || !displayName.trim()}
                  className="w-full rounded-full bg-orange-500 px-8 py-4 font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-neutral-300"
                >
                  {loading ? "Creating..." : "Create Group"}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-orange-500">
                Your group is ready!
              </p>

              <h1 className="mt-3 text-4xl font-bold">
                Invite Your Friends
              </h1>

              <p className="mt-4 leading-3 text-neutral-600">
                Share this code with your friends so they can join your group.
              </p>

              <div className="mt-8 rounded-1xl bg-orange-50 p-6">
                <p className="text-sm font-semibold text-neutral-600">
                  YOUR GROUP CODE
                </p>

                <p className="mt-3 text-4xl font-bold tracking-[0.3em] text-orange-600">
                  {inviteCode}
                </p>
              </div>

              <button
                type="button"
                onClick={copyCode}
                className="mt-5 w-full rounded-full border border-orange-200 px-8 py-3 font-semibold transition hover:bg-orange-100"
              >
                {copied ? "Copied ✓" : "Copy Group Code"}
              </button>

              <button
                type="button"
                onClick={() => router.push(`/lobby?group=${groupId}`)}
                className="mt-3 w-full rounded-full bg-orange-500 px-8 py-4 font-semibold text-white shadow-sm transition hover:bg-orange-600"
              >
                Go to Lobby
              </button>
            </div>
          )}
        </div>
      </section>
      {/* Footer */}
      <footer className="border-t border-orange-100 px-6 py-6 text-center text-sm text-neutral-500">
      </footer>
    </main>
  );
}