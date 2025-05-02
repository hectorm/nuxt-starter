<script setup lang="ts">
import { inject } from "vue";

import { definePageMeta } from "#imports";

import UButton from "@nuxt/ui/runtime/components/Button.vue";

import { sidebarKey } from "~/utils/symbols";

const sidebar = inject(sidebarKey);

definePageMeta({
  title: "pages.about.title",
  description: "pages.about.description",
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
      <h1 class="text-xl font-bold">{{ $t("pages.about.title") }}</h1>
    </header>
    <main class="p-4">
      <!-- page content -->
    </main>
  </div>
</template>
