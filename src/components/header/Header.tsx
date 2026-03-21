import { ThemeToggleButton } from "../common/ThemeToggleButton";
import NotificationDropdown from "./NotificationDropdown";
import UserDropdown from "./UserDropdown";
import LanguageSwitcher from "../common/LanguageSwitcher";

interface HeaderProps {
  onClick?: () => void;
  onToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onClick, onToggle }) => {
  return (
    <header className="sticky top-0 z-40 flex w-full bg-white border-b border-gray-200 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between w-full px-4 py-3 lg:px-6">
        <div className="flex items-center gap-2">
          {/* Mobile hamburger */}
          <button
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            onClick={onToggle}
            aria-label="Toggle menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <LanguageSwitcher />
          <ThemeToggleButton />
          <NotificationDropdown />
          <UserDropdown />
        </div>
      </div>
    </header>
  );
};

export default Header;