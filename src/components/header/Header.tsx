import { ThemeToggleButton } from "../common/ThemeToggleButton";
import NotificationDropdown from "./NotificationDropdown";
import UserDropdown from "./UserDropdown";
import { ExtendedUser } from "../../types/User";

interface HeaderProps {
  user?: ExtendedUser;
  onClick?: () => void;
  onToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onClick, onToggle }) => {
  return (
    <header className="sticky top-0 flex w-full bg-white border-b border-gray-200 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between w-full p-4 lg:px-6">
        <div className="flex items-center gap-4">
          {/* Sidebar toggle buttons */}
          <button className="lg:hidden" onClick={onToggle}>
            ☰
          </button>
          <button className="hidden lg:block" onClick={onClick}>
            ✕
          </button>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggleButton />
          <NotificationDropdown />
          <UserDropdown user={user} />
        </div>
      </div>
    </header>
  );
};

export default Header;