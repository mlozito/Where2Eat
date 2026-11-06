import { GroupPage, type GroupPageProps } from "../_components/groupPage";
import RandomRoom from "./randomRoom";

export default function RandomPage({ searchParams }: GroupPageProps) {
  return <GroupPage searchParams={searchParams} Room={RandomRoom} />;
}