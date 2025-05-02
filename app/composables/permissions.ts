import type { Permission } from "~/domain/permissions";
import { useUserStore } from "~/stores/user";

export const usePermissions = () => {
  const userStore = useUserStore();

  const can = (requiredPermissions: Permission | Permission[]) => {
    if (userStore.user) {
      const userPermissions = userStore.user.permissions;
      return Array.isArray(requiredPermissions)
        ? requiredPermissions.every((p) => userPermissions.includes(p))
        : userPermissions.includes(requiredPermissions);
    }

    return false;
  };

  return { can };
};
