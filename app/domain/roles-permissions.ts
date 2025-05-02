import type { Permission } from "~/domain/permissions";
import type { Role } from "~/domain/roles";
import { Permissions } from "~/domain/permissions";
import { Roles } from "~/domain/roles";

export const RolesPermissions: Record<Role, Permission[]> = {
  [Roles.Admin]: [Permissions.Manage],
  [Roles.User]: [],
} as const;
