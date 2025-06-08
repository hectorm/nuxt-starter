<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { z } from "zod/v4";

import { useColorMode } from "#imports";

import type { DropdownMenuItem } from "@nuxt/ui";
import UButton from "@nuxt/ui/runtime/components/Button.vue";
import UDropdownMenu from "@nuxt/ui/runtime/components/DropdownMenu.vue";

import { usePermissions } from "~/composables/permissions";
import { useUserStore } from "~/stores/user";

defineProps<{
  collapsed?: boolean;
}>();

const userStore = useUserStore();
const { user } = storeToRefs(userStore);

const { can } = usePermissions();

const i18n = useI18n();

const colorMode = useColorMode();

const items = computed<DropdownMenuItem[]>(() => {
  const items: DropdownMenuItem[] = [];

  if (user.value) {
    items.push({ type: "label", label: user.value?.fullname }, { type: "separator" });
  }

  if (can("manage")) {
    items.push({
      type: "link",
      label: i18n.t("components.userMenu.settings.label"),
      icon: "i-lucide-settings",
      to: "/settings",
    });
  }

  items.push({
    type: "link",
    label: i18n.t("components.userMenu.language.label"),
    icon: "i-lucide-globe",
    children: i18n.locales.value.map((locale) => ({
      type: "checkbox",
      label: locale.name,
      checked: i18n.locale.value === locale.code,
      onSelect(e: Event) {
        e.preventDefault();
        i18n.setLocale(locale.code);
        z.config((locale.code in z.locales ? z.locales[locale.code] : z.locales.en)());
      },
    })),
  });

  items.push({
    type: "link",
    label: i18n.t("components.userMenu.theme.label"),
    icon: "i-lucide-sun-moon",
    children: [
      {
        type: "checkbox",
        label: i18n.t("components.userMenu.theme.value.light"),
        icon: "i-lucide-sun",
        checked: colorMode.value === "light",
        onSelect(e: Event) {
          e.preventDefault();
          colorMode.preference = "light";
        },
      },
      {
        type: "checkbox",
        label: i18n.t("components.userMenu.theme.value.dark"),
        icon: "i-lucide-moon",
        checked: colorMode.value === "dark",
        onSelect(e: Event) {
          e.preventDefault();
          colorMode.preference = "dark";
        },
      },
    ],
  });

  items.push({
    type: "separator",
  });

  if (user.value) {
    items.push({
      type: "link",
      label: i18n.t("components.userMenu.logOut.label"),
      icon: "i-lucide-log-out",
      to: "/api/oidc/logout",
      external: true,
    });
  } else {
    items.push({
      type: "link",
      label: i18n.t("components.userMenu.logIn.label"),
      icon: "i-lucide-log-in",
      to: "/api/oidc/login",
      external: true,
    });
  }

  return items;
});
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      :label="collapsed ? undefined : (user?.fullname ?? i18n.t('components.userMenu.anonymous.label'))"
      :aria-label="user?.fullname ?? i18n.t('components.userMenu.anonymous.label')"
      :trailing-icon="collapsed ? 'i-lucide-circle-user' : 'i-lucide-chevrons-up-down'"
      class="data-[state=open]:bg-elevated"
      color="neutral"
      variant="ghost"
      :square="collapsed"
      :block="!collapsed"
      :ui="{ trailingIcon: 'text-dimmed' }"
    />
    <template #chip-leading="{ item }">
      <span
        class="ms-0.5 size-2 rounded-full bg-(--chip)"
        :style="{ '--chip': `var(--color-${(item as any).chip}-400)` }"
      />
    </template>
  </UDropdownMenu>
</template>
