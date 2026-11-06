import { GroupPage, type GroupPageProps } from "../_components/groupPage";
import PreferencesForm from "./preferencesForm";

export default function PreferencesPage({ searchParams }: GroupPageProps) {
  return <GroupPage searchParams={searchParams} Room={PreferencesForm} />;
}