<script setup lang="ts">
import { computed, inject } from "vue";
import { useI18n } from "vue-i18n";

import { definePageMeta } from "#imports";

import type { NavigationMenuItem } from "@nuxt/ui";
import UButton from "@nuxt/ui/runtime/components/Button.vue";
import UNavigationMenu from "@nuxt/ui/runtime/components/NavigationMenu.vue";

import { sidebarKey } from "~/utils/symbols";

const i18n = useI18n();

const sidebar = inject(sidebarKey);

const menu = computed<NavigationMenuItem[]>(() => {
  const menu: NavigationMenuItem[] = [
    {
      label: i18n.t("pages.settings.general.tab"),
      icon: "i-lucide-settings-2",
      to: "/settings",
      exact: true,
    },
    {
      label: i18n.t("pages.settings.users.tab"),
      icon: "i-lucide-users",
      to: "/settings/users",
    },
  ];

  return menu;
});

definePageMeta({
  title: "pages.settings.title",
  description: "pages.settings.description",
  middleware: ["auth", "can"],
  permissions: ["manage"],
});
</script>

<template>
  <div class="flex flex-col w-full overflow-auto">
    <header class="flex flex-row items-center p-4 gap-1.5 border-b border-default">
      <UButton
        :aria-label="$t('layouts.default.sidebar.toggle')"
        icon="i-lucide-menu"
        color="neutral"
        variant="ghost"
        square
        @click="sidebar?.toggle()"
      />
      <h1 class="text-xl font-bold">{{ $t("pages.settings.title") }}</h1>
    </header>
    <main class="flex flex-col overflow-hidden">
      <UNavigationMenu
        orientation="horizontal"
        :items="menu"
        highlight
        highlight-color="primary"
        class="px-4 border-b border-default"
      />
      <NuxtPage />
    </main>
  </div>
</template>
