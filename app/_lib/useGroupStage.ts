"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { allowedPaths, pathForGroup } from "./groupRoutes";
import { useLobby } from "./useLobby";

// keeps all users on the correct page 
export function useGroupStage(groupId: string) {
  const router = useRouter();
  const pathname = usePathname();
  const { lobby, error, reconnecting, refresh, fetchedAt} = useLobby(groupId);

  const visitStart = useRef(0);
  useEffect(() => {
    visitStart.current = Date.now();
  }, []);

  const target = lobby && !allowedPaths(lobby).includes(pathname) ? pathForGroup(lobby) : null;

  useEffect(() => {
    if (target && fetchedAt > visitStart.current) router.replace(target);
  }, [target, fetchedAt, router]);


  // "ready" is kept false while loading/redirecting, so pages don't flash at the wrong stage
  return { lobby, error, reconnecting, refresh, ready: !!lobby && !target };
}