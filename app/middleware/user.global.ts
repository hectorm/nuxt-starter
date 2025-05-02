import { callOnce, defineNuxtRouteMiddleware, useNuxtApp } from "nuxt/app";

import { useUserStore } from "~/stores/user";

export default defineNuxtRouteMiddleware(async () => {
  const nuxtApp = useNuxtApp();
  const userStore = useUserStore(nuxtApp.$pinia);

  await callOnce("user", () => userStore.fetchUser());
});
