import { Suspense, type ComponentType } from "react";
import { Loading, Shell } from "./shell";

// shared wrapper for all pages that use ?group=<id>

type SearchParams = Promise<{ group?: string }>;
export type GroupPageProps = { searchParams: SearchParams };

export function GroupPage({
  searchParams,
  Room,
}: {
  searchParams: SearchParams;
  Room: ComponentType<{ groupId: string }>;
}) {
  return (
    // reading from searchParams = inside <Suspense> -> data polls accurately and updates
    <Suspense fallback={<Loading />}>
      <GroupParam searchParams={searchParams} Room={Room} />
    </Suspense>
  );
}

async function GroupParam({
  searchParams,
  Room,
}: {
  searchParams: SearchParams;
  Room: ComponentType<{ groupId: string }>;
}) {
  const { group } = await searchParams;
  if (!group) {
    return (
      <Shell>
        <p className="rounded-2xl bg-white p-6 shadow-sm">No group selected.</p>
      </Shell>
    );
  }
  return <Room groupId={group} />;
}