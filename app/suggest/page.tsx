import { GroupPage, type GroupPageProps } from "../_components/groupPage";
import SuggestRoom from "./suggestRoom";

export default function SuggestPage({ searchParams }: GroupPageProps) {
  return <GroupPage searchParams={searchParams} Room={SuggestRoom} />;
}