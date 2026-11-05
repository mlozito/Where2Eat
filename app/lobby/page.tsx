import LobbyRoom from "./lobbyRoom";

export default async function LobbyPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  const { group } = await searchParams;
  if (!group) return <p className="p-6">No group selected.</p>;
  return <LobbyRoom groupId={group} />;
}