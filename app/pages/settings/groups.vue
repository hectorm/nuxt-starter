<script setup lang="ts">
import type { ComponentPublicInstance } from "vue";
import { useInfiniteScroll } from "@vueuse/core";
import { useNuxtApp } from "nuxt/app";
import { computed, ref, shallowRef, useTemplateRef, watch } from "vue";
import { useI18n } from "vue-i18n";

import { definePageMeta, useOverlay, useToast } from "#imports";

import type { DropdownMenuItem, TableColumn } from "@nuxt/ui";
import UBadge from "@nuxt/ui/runtime/components/Badge.vue";
import UButton from "@nuxt/ui/runtime/components/Button.vue";
import UDropdownMenu from "@nuxt/ui/runtime/components/DropdownMenu.vue";
import UFieldGroup from "@nuxt/ui/runtime/components/FieldGroup.vue";
import UInput from "@nuxt/ui/runtime/components/Input.vue";
import UPopover from "@nuxt/ui/runtime/components/Popover.vue";
import USelectMenu from "@nuxt/ui/runtime/components/SelectMenu.vue";
import UTable from "@nuxt/ui/runtime/components/Table.vue";

import type { RouterInputs, RouterOutputs } from "~/types/trpc";

import LazyDeleteModal from "~/components/groups/DeleteModal.vue";
import LazyUpsertModal from "~/components/groups/UpsertModal.vue";
import SearchMenu from "~/components/ui/SearchMenu.vue";

type SearchInput = NonNullable<Exclude<RouterInputs["group"]["search"], void>>;
type SearchOutput = RouterOutputs["group"]["search"];
type RoleListOutput = RouterOutputs["role"]["list"];

type Group = SearchOutput["groups"][number];

const i18n = useI18n();

const overlay = useOverlay();
const toast = useToast();

const { $client } = useNuxtApp();

const query = ref<SearchInput>({ limit: 100, orderBy: "name", order: "asc" });
const result = shallowRef<SearchOutput>(await $client.group.search.query(query.value));
const groups = shallowRef<Group[]>(result.value.groups);
const roles = shallowRef<RoleListOutput>(await $client.role.list.query());
const loading = ref<boolean>(false);

const upsertModal = overlay.create(LazyUpsertModal);
const deleteModal = overlay.create(LazyDeleteModal);

const doSearch = async (reset = false) => {
  try {
    loading.value = true;
    if (reset) {
      if (table.value) table.value.$el.scrollTop = 0;
      result.value = await $client.group.search.query({ ...query.value, cursor: undefined });
      groups.value = result.value.groups;
    } else {
      result.value = await $client.group.search.query({ ...query.value, cursor: result.value.nextCursor });
      groups.value = groups.value.concat(result.value.groups);
    }
  } finally {
    loading.value = false;
  }
};

const table = useTemplateRef<ComponentPublicInstance>("table");

const columns = computed<TableColumn<Group>[]>(() => [
  {
    id: "name",
    accessorKey: "name",
    meta: {
      sortable: true,
      filterable: true,
      class: { th: "w-0 min-w-50", td: "w-0 max-w-125 truncate" },
    },
  },
  {
    id: "description",
    accessorKey: "description",
    meta: {
      class: { th: "w-0 min-w-75", td: "w-0 max-w-150 truncate" },
    },
  },
  {
    id: "roles",
    accessorKey: "roles",
    accessorFn: (row) => row.roles.map(({ role }) => role.name),
    meta: {
      filterable: true,
      select: true,
      multiple: true,
      items: roles.value.map((role) => role.name),
      class: { th: "w-0 min-w-50", td: "w-0" },
    },
  },
  {
    id: "action",
    meta: {
      class: { th: "w-0 min-w-15", td: "w-0 px-0 text-center bg-clip-content" },
    },
  },
]);

const columnPinning = {
  left: [],
  right: ["action"],
};

const hasOrder = (column: TableColumn<Group>) => {
  return query.value.orderBy === column.id && !!query.value.order;
};

const setOrder = (column: TableColumn<Group>, order: "asc" | "desc" | undefined) => {
  query.value.orderBy = column.id as SearchInput["orderBy"];
  query.value.order = order;
  doSearch(true);
};

const hasFilter = (column: TableColumn<Group>) => {
  return query.value.searchBy === column.id && query.value.search && query.value.search.length > 0;
};

const setFilter = (column: TableColumn<Group>, value: string | string[]) => {
  query.value.searchBy = column.id as SearchInput["searchBy"];
  query.value.search = value;
  doSearch(true);
};

const getDropdownActions = (group: Group): DropdownMenuItem[] => {
  return [
    {
      label: i18n.t("pages.settings.groups.table.actions.update.label"),
      icon: "i-lucide-edit",
      color: "neutral",
      onSelect: () => openUpdateModal(group),
    },
    {
      label: i18n.t("pages.settings.groups.table.actions.delete.label"),
      icon: "i-lucide-trash-2",
      color: "error",
      onSelect: () => openDeleteModal(group),
    },
  ];
};

const openCreateModal = async () => {
  const instance = upsertModal.open({ id: null });
  const result = await instance.result;
  if (result.group) {
    groups.value = groups.value.toSpliced(0, 0, result.group);
    toast.add({
      color: "success",
      title: i18n.t("pages.settings.groups.table.actions.create.success.title"),
      description: i18n.t("pages.settings.groups.table.actions.create.success.description"),
    });
  } else if (result.error) {
    toast.add({
      color: "error",
      title: i18n.t("pages.settings.groups.table.actions.create.error.title"),
      description: i18n.t("pages.settings.groups.table.actions.create.error.description"),
    });
  }
};

const openUpdateModal = async (group: Group) => {
  const instance = upsertModal.open({ id: group.id });
  const result = await instance.result;
  if (result.group) {
    const i = groups.value.findIndex((group) => group.id === result.group!.id);
    if (i >= 0) groups.value = groups.value.toSpliced(i, 1, result.group);
    toast.add({
      color: "success",
      title: i18n.t("pages.settings.groups.table.actions.update.success.title"),
      description: i18n.t("pages.settings.groups.table.actions.update.success.description"),
    });
  } else if (result.error) {
    toast.add({
      color: "error",
      title: i18n.t("pages.settings.groups.table.actions.update.error.title"),
      description: i18n.t("pages.settings.groups.table.actions.update.error.description"),
    });
  }
};

const openDeleteModal = async (group: Group) => {
  const instance = deleteModal.open({ id: group.id });
  const result = await instance.result;
  if (result.group) {
    const i = groups.value.findIndex((group) => group.id === result.group!.id);
    if (i >= 0) groups.value = groups.value.toSpliced(i, 1);
    toast.add({
      color: "success",
      title: i18n.t("pages.settings.groups.table.actions.delete.success.title"),
      description: i18n.t("pages.settings.groups.table.actions.delete.success.description"),
    });
  } else if (result.error) {
    toast.add({
      color: "error",
      title: i18n.t("pages.settings.groups.table.actions.delete.error.title"),
      description: i18n.t("pages.settings.groups.table.actions.delete.error.description"),
    });
  }
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
  title: "pages.settings.groups.title",
  description: "pages.settings.groups.description",
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
    :data="groups"
    :loading="loading"
    sticky
  >
    <template v-for="{ id } in columns" #[`${id}-header`]="{ column }" :key="id">
      <template v-if="id === 'action'">
        <UButton
          :aria-label="$t('pages.settings.groups.table.actions.create.label')"
          color="neutral"
          variant="ghost"
          icon="i-lucide-plus"
          @click="() => openCreateModal()"
        />
      </template>
      <UFieldGroup v-else :aria-label="$t(`pages.settings.groups.table.${id}`)" class="-mx-2.5 flex w-full flex-row">
        <UButton
          v-if="(column.columnDef.meta as any).sortable"
          :label="$t(`pages.settings.groups.table.${id}`)"
          :aria-label="$t('pages.settings.groups.table.sort')"
          color="neutral"
          variant="ghost"
          class="flex-1"
          :icon="
            hasOrder(column)
              ? query.order === 'asc'
                ? 'i-lucide-arrow-up-narrow-wide'
                : 'i-lucide-arrow-down-wide-narrow'
              : 'i-lucide-arrow-up-down'
          "
          @click="setOrder(column, query.order === 'asc' ? 'desc' : 'asc')"
        />
        <UButton
          v-else
          :label="$t(`pages.settings.groups.table.${id}`)"
          color="neutral"
          variant="ghost"
          class="flex-1 cursor-default"
        />
        <UPopover v-if="(column.columnDef.meta as any).filterable">
          <UButton
            :aria-label="$t('pages.settings.groups.table.filter')"
            color="neutral"
            variant="ghost"
            :icon="hasFilter(column) ? 'i-lucide-list-filter-plus' : 'i-lucide-list-filter'"
          />
          <template #content>
            <template v-if="(column.columnDef.meta as any).select">
              <template v-if="(column.columnDef.meta as any).searchFn">
                <SearchMenu
                  :model-value="hasFilter(column) && Array.isArray(query.search) ? query.search : []"
                  :aria-label="$t('pages.settings.groups.table.search')"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-search"
                  :search-fn="(column.columnDef.meta as any).searchFn"
                  :multiple="(column.columnDef.meta as any).multiple"
                  class="w-64"
                  @update:model-value="setFilter(column, $event)"
                />
              </template>
              <template v-else>
                <USelectMenu
                  :model-value="hasFilter(column) && Array.isArray(query.search) ? query.search : []"
                  :aria-label="$t('pages.settings.groups.table.search')"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-search"
                  :items="(column.columnDef.meta as any).items ?? []"
                  :multiple="(column.columnDef.meta as any).multiple"
                  :search-input="false"
                  class="w-64"
                  @update:model-value="setFilter(column, $event)"
                />
              </template>
            </template>
            <template v-else>
              <UInput
                :model-value="hasFilter(column) && !Array.isArray(query.search) ? query.search : ''"
                :aria-label="$t('pages.settings.groups.table.search')"
                color="neutral"
                variant="ghost"
                icon="i-lucide-search"
                class="w-64"
                @keydown.enter="setFilter(column, $event.target.value)"
              />
            </template>
          </template>
        </UPopover>
      </UFieldGroup>
    </template>
    <template v-for="{ id } in columns" #[`${id}-cell`]="{ column, row, cell }" :key="id">
      <template v-if="id === 'action'">
        <UDropdownMenu :items="getDropdownActions((row as any).original)">
          <UButton
            :aria-label="$t('pages.settings.groups.table.actions.title')"
            color="neutral"
            variant="ghost"
            icon="i-lucide-ellipsis-vertical"
          />
        </UDropdownMenu>
      </template>
      <template v-else-if="(column.columnDef.meta as any).multiple">
        <UBadge
          v-for="value in cell.getValue()"
          :key="value"
          :label="value"
          color="neutral"
          variant="outline"
          class="mr-1.5"
        />&nbsp;
      </template>
      <template v-else>
        {{ cell.getValue() || "&nbsp;" }}
      </template>
    </template>
    <template #empty>&nbsp;</template>
  </UTable>
</template>
