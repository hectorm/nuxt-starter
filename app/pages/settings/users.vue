<script setup lang="ts">
import type { ComponentPublicInstance, VNode } from "vue";
import { useInfiniteScroll } from "@vueuse/core";
import { useNuxtApp } from "nuxt/app";
import { storeToRefs } from "pinia";
import { computed, h, ref, resolveComponent, shallowRef, useTemplateRef, watch } from "vue";
import { useI18n } from "vue-i18n";

import { definePageMeta, useOverlay, useToast } from "#imports";

import type { DropdownMenuItem, TableColumn } from "@nuxt/ui";
import UBadge from "@nuxt/ui/runtime/components/Badge.vue";
import UButton from "@nuxt/ui/runtime/components/Button.vue";
import UButtonGroup from "@nuxt/ui/runtime/components/ButtonGroup.vue";
import UDropdownMenu from "@nuxt/ui/runtime/components/DropdownMenu.vue";
import UInput from "@nuxt/ui/runtime/components/Input.vue";
import UPopover from "@nuxt/ui/runtime/components/Popover.vue";
import UTable from "@nuxt/ui/runtime/components/Table.vue";

import type { RouterInputs, RouterOutputs } from "~/types/trpc";
import { useUserStore } from "~/stores/user";

import LazyDeleteModal from "~/components/users/DeleteModal.vue";
import LazyEditModal from "~/components/users/EditModal.vue";

type SearchInput = NonNullable<Exclude<RouterInputs["user"]["search"], void>>;
type SearchOutput = RouterOutputs["user"]["search"];
type RoleOutput = RouterOutputs["role"]["getAll"];

type User = SearchOutput["users"][number];

// https://github.com/nuxt/ui/issues/2968
const USelectMenu = resolveComponent("USelectMenu");

const i18n = useI18n();

const overlay = useOverlay();
const toast = useToast();

const userStore = useUserStore();
const { user: me } = storeToRefs(userStore);

const { $client } = useNuxtApp();

const query = ref<SearchInput>({ limit: 50, orderBy: "username", order: "asc" });
const result = shallowRef<SearchOutput>(await $client.user.search.query(query.value));
const users = shallowRef<User[]>(result.value.users);
const roles = shallowRef<RoleOutput>(await $client.role.getAll.query());
const loading = ref<boolean>(false);

const editModal = overlay.create(LazyEditModal);
const deleteModal = overlay.create(LazyDeleteModal);

const doSearch = async (reset = false) => {
  try {
    loading.value = true;
    if (reset) {
      if (table.value) table.value.$el.scrollTop = 0;
      result.value = await $client.user.search.query({ ...query.value, cursor: undefined });
      users.value = result.value.users;
    } else {
      result.value = await $client.user.search.query({ ...query.value, cursor: result.value.nextCursor });
      users.value = users.value.concat(result.value.users);
    }
  } finally {
    loading.value = false;
  }
};

const table = useTemplateRef<ComponentPublicInstance>("table");

const columns = computed<TableColumn<User>[]>(() => [
  {
    header: getColumnHeader({ sortable: true, filterable: true }),
    accessorKey: "username",
    meta: { class: { th: "w-0", td: "w-0 min-w-75 max-w-150 truncate" } },
  },
  {
    header: getColumnHeader({ sortable: true, filterable: true }),
    accessorKey: "fullname",
    meta: { class: { th: "w-0", td: "w-0 min-w-75 max-w-150 truncate" } },
  },
  {
    header: getColumnHeader({ sortable: true, filterable: true }),
    accessorKey: "email",
    meta: { class: { th: "w-0", td: "w-0 min-w-75 max-w-150 truncate" } },
  },
  {
    header: getColumnHeader({ sortable: false, filterable: true }),
    accessorKey: "roles",
    accessorFn: (row) => row.roles.map(({ role }) => role.name),
    meta: { class: { th: "w-0", td: "w-0" } },
  },
  {
    id: "action",
    meta: { class: { th: "w-0", td: "w-0 border-t border-default" } },
  },
]);

const columnPinning = {
  left: [],
  right: ["action"],
};

const getColumnHeader = ({ sortable = false, filterable = false } = {}): TableColumn<User>["header"] => {
  return ({ column }) => {
    const { searchBy, search, orderBy, order } = query.value;

    const hasSearch = searchBy === column.id && search && search.length > 0;
    const hasOrder = orderBy === column.id && !!order;

    const label = i18n.t(`pages.settings.users.table.${column.id}`);

    return h(UButtonGroup, { "aria-label": label, class: "flex flex-row w-full -mx-2.5" }, () => {
      const children: VNode[] = [];

      if (sortable) {
        children.push(
          h(UButton, {
            label,
            "aria-label": i18n.t("pages.settings.users.table.sort"),
            color: "neutral",
            variant: "ghost",
            icon: hasOrder
              ? order === "asc"
                ? "i-lucide-arrow-up-narrow-wide"
                : "i-lucide-arrow-down-wide-narrow"
              : "i-lucide-arrow-up-down",
            class: "flex-1",
            onClick: () => {
              query.value.orderBy = column.id as SearchInput["orderBy"];
              query.value.order = order === "asc" ? "desc" : "asc";
              doSearch(true);
            },
          }),
        );
      } else {
        children.push(
          h(UButton, {
            label,
            "aria-label": i18n.t("pages.settings.users.table.sort"),
            color: "neutral",
            variant: "ghost",
            class: "flex-1",
          }),
        );
      }

      if (filterable) {
        children.push(
          h(UPopover, null, {
            default: () => {
              return h(UButton, {
                "aria-label": i18n.t("pages.settings.users.table.filter"),
                color: "neutral",
                variant: "ghost",
                icon: hasSearch ? "i-lucide-list-filter-plus" : "i-lucide-list-filter",
              });
            },
            content: () => {
              if (column.id === "roles") {
                return h(USelectMenu, {
                  "aria-label": i18n.t("pages.settings.users.table.search"),
                  color: "neutral",
                  variant: "ghost",
                  icon: "i-lucide-search",
                  class: "w-64",
                  multiple: true,
                  searchInput: false,
                  items: roles.value.map((role) => role.name),
                  modelValue: hasSearch && Array.isArray(search) ? search : [],
                  "onUpdate:modelValue": (value: string[]) => {
                    query.value.searchBy = column.id as SearchInput["searchBy"];
                    query.value.search = value;
                    doSearch(true);
                  },
                });
              } else {
                return h(UInput, {
                  "aria-label": i18n.t("pages.settings.users.table.search"),
                  color: "neutral",
                  variant: "ghost",
                  icon: "i-lucide-search",
                  class: "w-64",
                  modelValue: hasSearch && !Array.isArray(search) ? search : "",
                  onKeydown: (e: KeyboardEvent) => {
                    if (e.key !== "Enter") return;
                    query.value.searchBy = column.id as SearchInput["searchBy"];
                    query.value.search = (e.target as HTMLInputElement).value;
                    doSearch(true);
                  },
                });
              }
            },
          }),
        );
      }

      return children;
    });
  };
};

const getDropdownActions = (user: User): DropdownMenuItem[] => {
  return [
    {
      label: i18n.t("pages.settings.users.table.actions.edit.label"),
      icon: "i-lucide-edit",
      color: "neutral",
      onSelect: async () => {
        const instance = editModal.open({ id: user.id });
        const result = await instance.result;
        if (result.user) {
          const i = users.value.findIndex((user) => user.id === result.user!.id);
          if (i >= 0) users.value = users.value.slice(0, i).concat(result.user!, users.value.slice(i + 1));
          toast.add({
            color: "success",
            title: i18n.t("pages.settings.users.table.actions.edit.success.title"),
            description: i18n.t("pages.settings.users.table.actions.edit.success.description"),
          });
        } else if (result.error) {
          toast.add({
            color: "error",
            title: i18n.t("pages.settings.users.table.actions.edit.error.title"),
            description: i18n.t("pages.settings.users.table.actions.edit.error.description"),
          });
        }
      },
    },
    {
      label: i18n.t("pages.settings.users.table.actions.delete.label"),
      icon: "i-lucide-trash-2",
      color: "error",
      disabled: user.id === me.value?.id,
      onSelect: async () => {
        const instance = deleteModal.open({ id: user.id });
        const result = await instance.result;
        if (result.user) {
          const i = users.value.findIndex((user) => user.id === result.user!.id);
          if (i >= 0) users.value = users.value.slice(0, i).concat(users.value.slice(i + 1));
          toast.add({
            color: "success",
            title: i18n.t("pages.settings.users.table.actions.delete.success.title"),
            description: i18n.t("pages.settings.users.table.actions.delete.success.description"),
          });
        } else if (result.error) {
          toast.add({
            color: "error",
            title: i18n.t("pages.settings.users.table.actions.delete.error.title"),
            description: i18n.t("pages.settings.users.table.actions.delete.error.description"),
          });
        }
      },
    },
  ];
};

useInfiniteScroll(
  () => table.value?.$el,
  () => doSearch(),
  {
    distance: 200,
    canLoadMore: () => result.value.nextCursor != null && !loading.value,
  },
);

// Force re-render on locale change
const tableKey = ref(0);
watch(i18n.locale, () => {
  tableKey.value = Date.now();
});

definePageMeta({
  title: "pages.settings.users.title",
  description: "pages.settings.users.description",
  middleware: ["auth", "can"],
  permissions: ["manage"],
});
</script>

<template>
  <UTable
    ref="table"
    :key="tableKey"
    :columns="columns"
    :column-pinning="columnPinning"
    :data="users"
    :loading="loading"
    sticky
  >
    <template #roles-cell="{ cell }">
      <UBadge
        v-for="role in cell.getValue()"
        :key="role"
        :label="role"
        color="neutral"
        variant="outline"
        class="mr-1.5"
      />
    </template>
    <template #action-cell="{ row }">
      <UDropdownMenu :items="getDropdownActions((row as any).original)">
        <UButton
          icon="i-lucide-ellipsis-vertical"
          color="neutral"
          variant="ghost"
          :aria-label="$t('pages.settings.users.table.actions.title')"
        />
      </UDropdownMenu>
    </template>
    <template #empty><br /></template>
  </UTable>
</template>
