import { abortNavigation, defineNuxtRouteMiddleware, navigateTo } from "nuxt/app";

import type { Permission } from "~/domain/permissions";
import { usePermissions } from "~/composables/permissions";

declare module "#app" {
  interface PageMeta {
    permissions?: Permission[];
  }
}

export default defineNuxtRouteMiddleware(async (to) => {
  const { can } = usePermissions();

  if (!can((to.meta.permissions as Permission[]) ?? [])) {
    if (to.path !== "/") {
      return navigateTo({ path: "/" }, { redirectCode: 302 });
    } else {
      return abortNavigation();
    }
  }
});
