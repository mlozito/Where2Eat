"use client";

import { useEffect, useState } from "react";
import type { LobbyState } from "@/src/prisma/server/services/lobby";

export function useLobby(groupId: string, intervalMs = 3000) {
  const [lobby, setLobby] = useState<LobbyState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const [tick, setTick] = useState(0);
  const [fetchedAt, setFetchedAt] = useState(0); // polls when lobby last bounced back from server

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let failures = 0;
    const controller = new AbortController();

    async function poll() {
      if (cancelled) return;

      if (document.visibilityState === "hidden") {
        timer = setTimeout(poll, intervalMs);
        return;
      }

      try {
        const response = await fetch(`/api/groups/${groupId}/lobby`, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (response.status === 401) {
          setError("You haven't joined this group.");
          return;
        }
        if (response.status === 404) {
          setError("That group doesn't exist.");
          return;
        }
        if (!response.ok) throw new Error(`Server returned ${response.status}`);

        const data = (await response.json()) as LobbyState;
        if (cancelled) return;
        failures = 0;
        setError(null);
        setReconnecting(false);
        setLobby(data);
        setFetchedAt(Date.now());
      } catch {
        if (cancelled) return;
        failures += 1;
        setReconnecting(true);
      }

      const delay = Math.min(intervalMs * 2 ** failures, 30_000);
      if (!cancelled) timer = setTimeout(poll, delay);
    }

    poll();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [groupId, intervalMs, tick]);

  return { lobby, error, reconnecting, fetchedAt, refresh: () => setTick((t) => t + 1) };
}