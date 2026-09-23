import { UserRole } from "@prisma/client";

export type Permission =
  | "assets:write"
  | "reference:write"
  | "users:manage"
  | "settings:manage";

const permissionsByRole: Record<UserRole, ReadonlySet<Permission>> = {
  ADMIN: new Set<Permission>([
    "assets:write",
    "reference:write",
    "users:manage",
    "settings:manage",
  ]),
  ASSET_MANAGER: new Set<Permission>(["assets:write", "reference:write"]),
  VIEWER: new Set<Permission>(),
};

export function hasPermission(
  role: UserRole | null | undefined,
  permission: Permission,
) {
  return role ? permissionsByRole[role].has(permission) : false;
}
