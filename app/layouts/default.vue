<script setup lang="ts">
import { breakpointsTailwind, createReusableTemplate, useBreakpoints } from "@vueuse/core";
import { useCookie } from "nuxt/app";
import { computed, provide, readonly, ref } from "vue";
import { useI18n } from "vue-i18n";

import type { NavigationMenuItem } from "@nuxt/ui";
import UNavigationMenu from "@nuxt/ui/runtime/components/NavigationMenu.vue";
import USlideover from "@nuxt/ui/runtime/components/Slideover.vue";

import { sidebarKey } from "~/utils/symbols";

import AppLogo from "~/components/ui/AppLogo.vue";
import UserMenu from "~/components/ui/UserMenu.vue";

const i18n = useI18n();

const [DefineMenu, ReuseMenu] = createReusableTemplate();

const breakpoints = useBreakpoints(breakpointsTailwind);
const lgAndLarger = breakpoints.greaterOrEqual("lg");

const sidebarOpen = useCookie(`sidebar_open`, {
  default: () => true,
  maxAge: 365 * 24 * 60 * 60,
  sameSite: "lax",
});
const slideoverOpen = ref(false);
const open = computed({
  get: () => (lgAndLarger.value ? sidebarOpen.value : slideoverOpen.value),
  set: (value) => ((lgAndLarger.value ? sidebarOpen : slideoverOpen).value = value),
});
const toggle = () => (open.value = !open.value);
provide(sidebarKey, { open: readonly(open), toggle });

const collapsed = computed(() => lgAndLarger.value && !open.value);

const menus = computed<NavigationMenuItem[][]>(() => {
  const start: NavigationMenuItem[] = [
    {
      label: i18n.t("pages.home.title"),
      "aria-label": i18n.t("pages.home.title"),
      icon: "i-lucide-house",
      to: "/",
    },
  ];

  const end: NavigationMenuItem[] = [
    {
      label: i18n.t("pages.about.title"),
      "aria-label": i18n.t("pages.about.title"),
      icon: "i-lucide-info",
      to: "/about",
    },
  ];

  return [start, end];
});
</script>

<template>
  <div class="flex h-screen flex-row">
    <DefineMenu>
      <div class="flex flex-row gap-2 p-4">
        <UButton
          v-if="!lgAndLarger"
          :aria-label="$t('layouts.default.sidebar.toggle')"
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          square
          @click="toggle()"
        />
        <NuxtLink to="/" class="flex flex-row gap-2" :aria-label="$t('app.name')">
          <AppLogo class="h-8" />
          <h1 v-if="!collapsed" class="text-2xl font-bold">{{ $t("app.name") }}</h1>
        </NuxtLink>
      </div>
      <nav class="flex flex-1 flex-col items-stretch gap-1 px-3.5 py-2">
        <UNavigationMenu
          v-for="(menu, index) in menus"
          :key="index"
          :collapsed="collapsed"
          :items="menu"
          orientation="vertical"
          :class="{ 'mt-auto': index === menus.length - 1 }"
          :ui="{ list: 'flex flex-col gap-1', link: 'p-2' }"
        >
        </UNavigationMenu>
      </nav>
      <div class="flex flex-col items-stretch gap-1 border-t border-default px-3.5 py-2">
        <UserMenu class="p-2" :collapsed="collapsed" />
      </div>
    </DefineMenu>
    <template v-if="lgAndLarger">
      <aside
        class="transition-width hidden flex-col overflow-x-hidden border-r border-default bg-elevated/25 duration-100 lg:flex"
        :class="[collapsed ? 'w-16 max-w-16 min-w-16' : 'w-[25%] max-w-64 min-w-48']"
        :style="{ 'scrollbar-width': 'thin' }"
      >
        <ReuseMenu />
      </aside>
    </template>
    <template v-else>
      <USlideover
        v-model:open="slideoverOpen"
        side="left"
        :title="$t('layouts.default.sidebar.title')"
        :description="$t('layouts.default.sidebar.description')"
      >
        <template #content>
          <ReuseMenu />
        </template>
      </USlideover>
    </template>
    <slot />
  </div>
</template>
