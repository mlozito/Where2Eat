/*import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert h-5 w-[100px]"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            To get started, edit the{" "}
            <code className="rounded bg-black/[.06] px-1.5 py-0.5 font-mono text-[0.9em] dark:bg-white/[.08]">
              page.tsx
            </code>{" "}
            file.
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Looking for a starting point or more instructions? Head over to{" "}
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Templates
            </a>{" "}
            or the{" "}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Learning
            </a>{" "}
            center.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert h-[14px] w-4"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={14}
            />
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  );
}*/


"use client";

import { useState } from "react";
import Link from "next/link";

export default function Home() {
  const [groupCode, setGroupCode] = useState("");

  return (
    <main className="min-h-screen bg-orange-50 text-neutral-900">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-6 md:px-12">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          Where2Eat<span className="text-orange-500">.</span>
        </Link>

        <Link
          href="/join-group"
          className="rounded-full border border-orange-200 px-5 py-2.5 font-medium transition hover:bg-orange-100"
        >
          Join a Group
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="mx-auto flex max-w-6xl flex-col items-center px-6 py-12 text-center md:py-20">
        <div className="mb-6 rounded-full bg-orange-100 px-4 py-2 text-sm font-medium text-orange-700">
          Less deciding, more dining
        </div>

        <h1 className="max-w-4xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl md:text-7xl">
          Where2Eat brings us together.
          <span className="mt-3 block text-orange-500">
            Let&apos;s decide together.
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600 md:text-xl">
          Tired of the endless &quot;Where do you want to eat?&quot;
          conversation? Bring your friends together and find a restaurant
          everyone can enjoy.
        </p>

        <div className="mt-9 flex w-full flex-col justify-center gap-4 sm:w-auto sm:flex-row">
          <Link
            href="/create-group"
            className="rounded-full bg-orange-500 px-8 py-4 text-center font-semibold text-white shadow-sm transition hover:bg-orange-600"
          >
            Create a Group →
          </Link>

          <Link
            href="/join-group"
            className="rounded-full border border-orange-200 bg-white px-8 py-4 text-center font-semibold transition hover:bg-orange-100"
          >
            Join a Group
          </Link>
        </div>

        {/* How It Works */}
        <div className="mt-24 w-full">
          <h2 className="text-3xl font-bold md:text-4xl">
            Your next meal, made easy.
          </h2>

          <p className="mt-3 text-neutral-600">
            Three simple steps between your group chat and your next meal.
          </p>

          <div className="mt-10 grid gap-6 text-left md:grid-cols-3">
            <div className="rounded-3xl border border-orange-100 bg-white p-7 shadow-sm">
              <div className="text-3xl"></div>
              <h3 className="mt-5 text-xl font-bold">
                1. Bring your group
              </h3>
              <p className="mt-3 leading-7 text-neutral-600">
                Start a group or join one your friends have already created.
              </p>
            </div>

            <div className="rounded-3xl border border-orange-100 bg-white p-7 shadow-sm">
              <div className="text-3xl"></div>
              <h3 className="mt-5 text-xl font-bold">
                2. Explore your options
              </h3>
              <p className="mt-3 leading-7 text-neutral-600">
                Find restaurant options that fit your group&apos;s preferences.
              </p>
            </div>

            <div className="rounded-3xl border border-orange-100 bg-white p-7 shadow-sm">
              <div className="text-3xl"></div>
              <h3 className="mt-5 text-xl font-bold">
                3. Make the decision
              </h3>
              <p className="mt-3 leading-7 text-neutral-600">
                Choose a restaurant together and spend less time debating.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Join Section */}
        <div className="mt-16 w-full max-w-xl rounded-3xl bg-neutral-900 p-8 text-white md:p-10">
          <h2 className="text-2xl font-bold">
            Already have a group?
          </h2>

          <p className="mt-2 text-neutral-300">
            Enter your group code to get started.
          </p>

          <form
            className="mt-6 flex flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();

              const code = groupCode.trim();

              if (code) {
                window.location.href = `/join-group?code=${encodeURIComponent(code)}`;
              }
            }}
          >
            <input
              type="text"
              value={groupCode}
              onChange={(event) => setGroupCode(event.target.value)}
              placeholder="Enter group code"
              aria-label="Group code"
              className="min-w-0 flex-1 rounded-full bg-white px-5 py-3 text-neutral-900 outline-none focus:ring-2 focus:ring-orange-400"
            />

            <button
              type="submit"
              className="rounded-full bg-orange-500 px-6 py-3 font-semibold transition hover:bg-orange-600"
            >
              Join Group
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-orange-100 px-6 py-6 text-center text-sm text-neutral-500">
        Where2Eat © 2026 · Good food, better together.
      </footer>
    </main>
  );
}
