import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { BanknotesIcon } from "@heroicons/react/24/outline";

import {
  BoxCubeIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import Logo from "../assets/logo2.png";
import { FileText, GitMerge, CalendarClock, Building2, BarChart2, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { APP_PERMISSIONS, hasPermission, isSuperAdmin } from "../lib/permissions";
import { useLanguage } from "../context/LanguageContext";

type NavItem = {
  key: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { key: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
  { icon: <GridIcon />, key: "dashboard", path: "/" },
  { icon: <Building2 className="w-5 h-5" />, key: "customers", path: "/customers" },
  { icon: <ShieldCheck className="w-5 h-5" />, key: "spAdmins", path: "/sp-admins" },
  { icon: <BanknotesIcon />, key: "transactions", path: "/transactions" },
  { icon: <CalendarClock className="w-5 h-5" />, key: "endOfDay", path: "/end-of-day" },
  { icon: <GitMerge className="w-5 h-5" />, key: "reconciliation", path: "/reconciliation" },
  { icon: <BoxCubeIcon />, key: "terminals", path: "/terminals" },
  { icon: <FileText />, key: "invoices", path: "/invoices" },
  { icon: <BarChart2 className="w-5 h-5" />, key: "reports", path: "/reports" },
];

const managementItems: NavItem[] = [];

const settingsItems: NavItem[] = [];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, toggleMobileSidebar } = useSidebar();
  const { user } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "management" | "account";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const isActive = (path: string) => location.pathname === path;
  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  useEffect(() => {
    let submenuMatched = false;
    ["main", "management"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : managementItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "management",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "management" | "account") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const isSpAdminOrAbove = (role?: string | null) => {
    const r = role?.toLowerCase();
    return r === "super_admin" || r === "sp_admin";
  };

  const filteredNavItems = navItems.filter((item) => {
    if (item.path === "/customers") return isSpAdminOrAbove(user?.role);
    if (item.path === "/sp-admins") return isSuperAdmin(user?.role);
    if (item.path === "/terminals") return hasPermission(user?.role, APP_PERMISSIONS.VIEW_TERMINALS);
    if (item.path === "/invoices") return hasPermission(user?.role, APP_PERMISSIONS.ACCESS_ECOMMERCE_DATA);
    if (item.path === "/reports") return hasPermission(user?.role, APP_PERMISSIONS.GENERATE_REPORTS);
    if (item.path === "/end-of-day") return hasPermission(user?.role, APP_PERMISSIONS.VIEW_EOD_REPORTS);
    return true;
  });

  const getLabel = (key: string) => t(key as any);

  const renderMenuItems = (items: NavItem[], menuType: "main" | "management" | "account") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.key}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={`menu-item-icon-size  ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{getLabel(nav.key)}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                onClick={() => isMobileOpen && toggleMobileSidebar()}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{getLabel(nav.key)}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.key}>
                    <Link
                      to={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {getLabel(subItem.key)}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge`}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge`}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-center"
        }`}
      >
        <Link to="/">
          <img
            src={Logo}
            alt="Logo"
            width={150}
            height={140}
            className={`${isExpanded || isHovered || isMobileOpen ? "" : "h-8 w-auto"}`}
          />
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(filteredNavItems, "main")}
            </div>

            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Account"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(settingsItems, "account")}
            </div>

          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
