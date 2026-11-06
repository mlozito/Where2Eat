import { GroupPage, type GroupPageProps } from "../_components/groupPage";
import ResultRoom from "./resultRoom";

export default function ResultPage({ searchParams }: GroupPageProps) {
  return <GroupPage searchParams={searchParams} Room={ResultRoom} />;
}