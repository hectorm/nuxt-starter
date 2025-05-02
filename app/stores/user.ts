import { useNuxtApp } from "nuxt/app";
import { defineStore } from "pinia";
import { ref } from "vue";

import type { RouterOutputs } from "~/types/trpc";

export const useUserStore = defineStore("user", () => {
  const { $client } = useNuxtApp();

  const user = ref<RouterOutputs["user"]["me"]>(null);

  const fetchUser = async () => {
    user.value = await $client.user.me.query();
  };

  return { user, fetchUser };
});
