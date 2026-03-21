import { useSidebar } from "../../context/SidebarContext";
import Header from "./Header";

export default function AppHeader() {
  const { toggleMobileSidebar } = useSidebar();

  return <Header onToggle={toggleMobileSidebar} />;
}