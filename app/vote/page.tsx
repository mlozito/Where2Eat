import { GroupPage, type GroupPageProps } from "../_components/groupPage";
import VoteRoom from "./voteRoom";

export default function VotePage({ searchParams }: GroupPageProps) {
  return <GroupPage searchParams={searchParams} Room={VoteRoom} />;
}