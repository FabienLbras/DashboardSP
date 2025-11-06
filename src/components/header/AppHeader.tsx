import { useSidebar } from "../../context/SidebarContext";
import Header from "./Header";

export default function AppHeader() {
  const { toggleSidebar } = useSidebar();

  return <Header onToggle={toggleSidebar} />;
}