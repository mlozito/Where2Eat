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
          Where2Eat
        </Link>
      </nav>

      {/* Home */}
      <section className="mx-auto flex max-w-6xl flex-col items-center px-6 py-12 text-center md:py-20">

        <h1 className="max-w-4xl text-1xl font-bold leading-tight tracking-tight sm:text-6xl md:text-2xl">
          Tired of the endless <span className="text-orange-600"><em>&quot;Where do you wanna eat?&quot;</em></span> conversation? Bring your friends together and find a restaurant
          everyone can enjoy.
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600 md:text-xl">
          Create a group or join one your friends have already made
        </p>

        <div className="mt-9 flex w-full flex-col justify-center gap-4 sm:w-auto sm:flex-row">
          <Link
            href="/create-group"
            className="rounded-full border border-orange-200 bg-white px-8 py-4 text-center font-semibold transition hover:bg-orange-100"
          >
            Create a Group
          </Link>

          <Link
            href="/join"
            className="rounded-full border border-orange-200 bg-white px-8 py-4 text-center font-semibold transition hover:bg-orange-100"
          >
            Join a Group
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-orange-100 px-6 py-6 text-center text-sm text-neutral-500">
        Where2Eat © 2026 · Less deciding, more dining.
      </footer>
    </main>
  );
}
