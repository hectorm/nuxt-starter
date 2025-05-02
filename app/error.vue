<script setup lang="ts">
import type { NuxtError } from "nuxt/app";
import { useHeadSafe, useSeoMeta } from "nuxt/app";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import { useColorMode } from "#imports";

import * as locales from "@nuxt/ui/locale";
import UApp from "@nuxt/ui/runtime/components/App.vue";
import UButton from "@nuxt/ui/runtime/components/Button.vue";
import UTextarea from "@nuxt/ui/runtime/components/Textarea.vue";

defineProps<{
  error: NuxtError;
}>();

const i18n = useI18n();
const locale = computed(() => locales[i18n.locale.value]);

const colorMode = useColorMode();
const themeColor = computed(() => (colorMode.value === "dark" ? "#052f4a" : "#f0f9ff"));

const dev = import.meta.dev;

useHeadSafe(
  computed(() => ({
    htmlAttrs: { lang: locale.value.code, dir: locale.value.dir },
    meta: [
      { charset: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { key: "theme-color", name: "theme-color", content: themeColor },
    ],
    link: [
      { rel: "icon", href: "/favicon.ico", sizes: "32x32" },
      { rel: "icon", href: "/icon.svg", type: "image/svg+xml" },
    ],
  })),
);

useSeoMeta({
  title: () => i18n.t("pages.error.title"),
  description: () => i18n.t("pages.error.description"),
});
</script>

<template>
  <UApp :locale="locale">
    <div class="flex flex-col h-screen overflow-auto items-center justify-between px-4 py-8 gap-8">
      <div class="flex flex-col flex-1 items-center justify-center w-full gap-4">
        <h1 class="text-6xl font-bold text-primary">
          {{ error.statusCode }}
        </h1>
        <h2 class="text-4xl">
          {{ i18n.t(`pages.error.message.${error.statusCode}`, {}, i18n.t("pages.error.message.500")) }}
        </h2>
        <UButton icon="i-lucide-arrow-left" size="xl" color="primary" variant="soft" class="mt-5" to="/">
          {{ i18n.t("pages.error.back") }}
        </UButton>
      </div>
      <div v-if="dev" class="flex flex-col items-center justify-center w-full gap-4">
        <UTextarea
          :model-value="error.stack"
          color="neutral"
          variant="subtle"
          :rows="20"
          readonly
          class="w-full"
          :style="{ 'scrollbar-width': 'thin' }"
          :ui="{ base: 'resize-none font-mono whitespace-pre' }"
        />
      </div>
    </div>
  </UApp>
</template>
