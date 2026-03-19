import { ROLE_PERMISSIONS } from "./rolePermissions"

export function checkPermission(userRole: string, permission: string) {
  return ROLE_PERMISSIONS[userRole]?.includes(permission)
}