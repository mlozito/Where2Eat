import type { ReactNode } from "react";

// page frame/loading state used by every page

export function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-orange-50 px-4 py-10 text-stone-900">
      <div className="mx-auto max-w-3xl">{children}</div>
    </main>
  );
}

export function Loading() {
  return (
    <Shell>
      <p className="rounded-2xl bg-white p-6 text-stone-500 shadow-sm">Loading…</p>
    </Shell>
  );
}