export const APP_ROLES = {
  SUPER_ADMIN: "super_admin",
  SP_ADMIN: "sp_admin",
  HOTEL_MANAGER: "hotel_manager",
  FINANCIAL_MANAGER: "financial_manager",
  FRONT_OFFICE_MANAGER: "front_office_manager",
  FRONT_OFFICE_OPERATOR: "front_office_operator",
  ADMIN: "admin",
} as const;

export type AppRole = (typeof APP_ROLES)[keyof typeof APP_ROLES];

export const APP_PERMISSIONS = {
  VIEW_PAYMENT_DATA: "view_payment_data",
  VIEW_TRANSACTIONS: "view_transactions",
  GENERATE_REPORTS: "generate_reports",
  EXPORT_REPORTS: "export_reports",
  VIEW_EOD_REPORTS: "view_eod_reports",
  USE_VIRTUAL_TERMINAL: "use_virtual_terminal",
  VIEW_TERMINALS: "view_terminals",
  MANAGE_TERMINALS: "manage_terminals",
  ACCESS_ECOMMERCE_DATA: "access_ecommerce_data",
  ACCESS_STANDARD_PREMIUM: "access_standard_premium",
  MANAGE_USERS: "manage_users",
  MODIFY_SYSTEM_CONFIG: "modify_system_config",
  MODIFY_GLOBAL_SETTINGS: "modify_global_settings",
} as const;

export type AppPermission = (typeof APP_PERMISSIONS)[keyof typeof APP_PERMISSIONS];

const rolePermissions: Record<string, AppPermission[]> = {
  [APP_ROLES.SUPER_ADMIN]: Object.values(APP_PERMISSIONS),
  // hotel_manager = customer super-admin: full access + manage users for their customer
  [APP_ROLES.HOTEL_MANAGER]: Object.values(APP_PERMISSIONS),
  // financial_manager: reports/transactions/EOD scoped to their property
  [APP_ROLES.FINANCIAL_MANAGER]: [
    APP_PERMISSIONS.VIEW_PAYMENT_DATA,
    APP_PERMISSIONS.VIEW_TRANSACTIONS,
    APP_PERMISSIONS.GENERATE_REPORTS,
    APP_PERMISSIONS.EXPORT_REPORTS,
    APP_PERMISSIONS.VIEW_EOD_REPORTS,
  ],
  [APP_ROLES.ADMIN]: Object.values(APP_PERMISSIONS),
  [APP_ROLES.FRONT_OFFICE_MANAGER]: [
    APP_PERMISSIONS.VIEW_PAYMENT_DATA,
    APP_PERMISSIONS.VIEW_TRANSACTIONS,
    APP_PERMISSIONS.GENERATE_REPORTS,
    APP_PERMISSIONS.EXPORT_REPORTS,
    APP_PERMISSIONS.VIEW_EOD_REPORTS,
    APP_PERMISSIONS.USE_VIRTUAL_TERMINAL,
  ],
  [APP_ROLES.FRONT_OFFICE_OPERATOR]: [
    APP_PERMISSIONS.VIEW_PAYMENT_DATA,
    APP_PERMISSIONS.VIEW_TRANSACTIONS,
  ],
};

export function normalizeRole(role?: string | null): AppRole | null {
  if (!role) return null;

  const normalized = role.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (normalized === "super_admin") return APP_ROLES.SUPER_ADMIN;
  if (normalized === "sp_admin") return APP_ROLES.SP_ADMIN;
  if (normalized === "hotel_manager") return APP_ROLES.HOTEL_MANAGER;
  if (normalized === "financial_manager") return APP_ROLES.FINANCIAL_MANAGER;
  if (normalized === "front_office_manager" || normalized === "frontoffice_manager") return APP_ROLES.FRONT_OFFICE_MANAGER;
  if (normalized === "front_office_operator" || normalized === "frontoffice_operator") return APP_ROLES.FRONT_OFFICE_OPERATOR;
  if (normalized === "admin") return APP_ROLES.ADMIN;
  return normalized as AppRole;
}

export function isSuperAdmin(role?: string | null): boolean {
  return normalizeRole(role) === APP_ROLES.SUPER_ADMIN;
}

export function isPlatformAdmin(role?: string | null): boolean {
  const r = normalizeRole(role);
  return r === APP_ROLES.SUPER_ADMIN || r === APP_ROLES.SP_ADMIN;
}

export function isHotelManager(role?: string | null): boolean {
  return normalizeRole(role) === APP_ROLES.HOTEL_MANAGER;
}

export function getRoleLabel(role?: string | null): string {
  switch (normalizeRole(role)) {
    case APP_ROLES.SUPER_ADMIN:
      return "Super Admin";
    case APP_ROLES.SP_ADMIN:
      return "Admin";
    case APP_ROLES.HOTEL_MANAGER:
      return "Hotel Manager";
    case APP_ROLES.FINANCIAL_MANAGER:
      return "Financial Manager";
    case APP_ROLES.FRONT_OFFICE_MANAGER:
      return "Front Office Manager";
    case APP_ROLES.FRONT_OFFICE_OPERATOR:
      return "Front Office Operator";
    case APP_ROLES.ADMIN:
      return "Administrator";
    default:
      return role || "User";
  }
}

export function hasPermission(role: string | null | undefined, permission: AppPermission): boolean {
  const normalizedRole = normalizeRole(role);
  if (!normalizedRole) return false;
  return (rolePermissions[normalizedRole] || []).includes(permission);
}

export function hasAnyPermission(role: string | null | undefined, permissions: AppPermission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}
