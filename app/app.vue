<script setup lang="ts">
import { breakpointsTailwind, provideSSRWidth } from "@vueuse/core";
import { useHeadSafe, useRequestURL, useSeoMeta } from "nuxt/app";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { z } from "zod/v4";

import { useColorMode } from "#imports";

import * as locales from "@nuxt/ui/locale";
import UApp from "@nuxt/ui/runtime/components/App.vue";

import { useDevice } from "~/composables/device";

const route = useRoute();

const i18n = useI18n();
const locale = computed(() => locales[i18n.locale.value]);

z.config((i18n.locale.value in z.locales ? z.locales[i18n.locale.value] : z.locales.en)());

const colorMode = useColorMode();
const themeColor = computed(() => (colorMode.value === "dark" ? "#052f4a" : "#f0f9ff"));

const { isMobile } = useDevice();
provideSSRWidth(isMobile ? breakpointsTailwind.md : breakpointsTailwind.lg);

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
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
  })),
);

const title = computed(() => i18n.t((route.meta.title as string) || "layouts.default.title"));
const description = computed(() => i18n.t((route.meta.description as string) || "layouts.default.description"));
const url = useRequestURL();

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogUrl: url.href,
  ogImage: `${url.origin}/icon-og.png`,
});
</script>

<template>
  <UApp :locale="locale">
    <NuxtRouteAnnouncer />
    <NuxtLoadingIndicator />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
