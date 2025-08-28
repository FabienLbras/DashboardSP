import { SidebarProvider } from "../context/SidebarContext";
import { Outlet } from "react-router-dom";
import AppHeader from "../components/header/AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";
import { useSidebar } from "../context/SidebarContext";
import { ExtendedUser } from "../types/User";

const LayoutContent: React.FC<{ user?: ExtendedUser }> = ({ user }) => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div className="min-h-screen xl:flex">
      <div>
        <AppSidebar />
        <Backdrop />
      </div>
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
        } ${isMobileOpen ? "ml-0" : ""}`}
      >
        {/* ✅ Pass user to AppHeader */}
        <AppHeader user={user} />
        <div className="p-4 mx-auto max-w-screen-2xl md:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const AppLayout: React.FC<{ user?: ExtendedUser }> = ({ user }) => {
  return (
    <SidebarProvider>
      <LayoutContent user={user} />
    </SidebarProvider>
  );
};

export default AppLayout;