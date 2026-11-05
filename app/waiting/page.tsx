import ProgressRoom from "./progressRoom";

export default async function WaitingPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  const { group } = await searchParams;
  if (!group) return <p className="p-6">No group selected.</p>;
  return <ProgressRoom groupId={group} />;
}