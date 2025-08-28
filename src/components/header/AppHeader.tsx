import { ExtendedUser } from "../../types/User";
import { useSidebar } from "../../context/SidebarContext";
import Header from "./Header";

export default function AppHeader({ user }: { user?: ExtendedUser }) {
  const { toggleSidebar } = useSidebar();

  return <Header onToggle={toggleSidebar} user={user} />;
}