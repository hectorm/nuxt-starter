import { defineNuxtRouteMiddleware, navigateTo, useNuxtApp } from "nuxt/app";

import { useUserStore } from "~/stores/user";

export default defineNuxtRouteMiddleware(async (to) => {
  const nuxtApp = useNuxtApp();
  const userStore = useUserStore(nuxtApp.$pinia);

  if (!userStore.user) {
    return navigateTo(
      {
        path: "/api/oidc/login",
        query: { redirect: to.fullPath },
      },
      {
        redirectCode: 302,
        external: true,
      },
    );
  }
});
