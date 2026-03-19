import { ThemeToggleButton } from "../common/ThemeToggleButton";
import NotificationDropdown from "./NotificationDropdown";
import UserDropdown from "./UserDropdown";

interface HeaderProps {
  onClick?: () => void;
  onToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onClick, onToggle }) => {
  return (
    <header className="sticky top-0 z-40 flex w-full bg-white border-b border-gray-200 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between w-full p-4 lg:px-6">
        <div className="flex items-center gap-4">
          {/* Sidebar toggle buttons */}
          <button className="lg:hidden" onClick={onToggle}>
            ☰
          </button>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggleButton />
          <NotificationDropdown />
          <UserDropdown />
        </div>
      </div>
    </header>
  );
};

export default Header;