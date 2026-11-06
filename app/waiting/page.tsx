import { GroupPage, type GroupPageProps } from "../_components/groupPage";
import ProgressRoom from "./progressRoom";

export default function WaitingPage({ searchParams }: GroupPageProps) {
  return <GroupPage searchParams={searchParams} Room={ProgressRoom} />;
}