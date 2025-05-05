<script setup lang="ts" generic="TResult, TMultiple extends boolean = false">
import { computed, ref, shallowRef, useAttrs, watch } from "vue";

type ModelValue<M extends boolean> = M extends true ? string[] : string;

const props = withDefaults(
  defineProps<{
    modelValue?: ModelValue<TMultiple>;
    searchFn?: (search?: string) => Promise<TResult>;
    mapFn?: (result: TResult) => string[];
    multiple?: TMultiple;
  }>(),
  {
    modelValue: undefined,
    searchFn: () => Promise.resolve([] as TResult),
    mapFn: (result: TResult) => result as string[],
    // @ts-expect-error ignore wrong type
    multiple: false,
  },
);

const search = ref<string>();
const items = shallowRef<string[]>([]);
const loading = ref<boolean>(false);
const timer = ref<NodeJS.Timeout | null>(null);

const doSearch = async (value?: string) => {
  try {
    loading.value = true;
    items.value = props.mapFn(await props.searchFn(value));
  } catch {
    items.value = [];
  } finally {
    loading.value = false;
  }
};

watch(search, (value) => {
  if (timer.value) clearTimeout(timer.value);
  timer.value = setTimeout(() => doSearch(value), 500);
});

const emit = defineEmits(["update:modelValue"]);

const internalModelValue = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});
const attrs = useAttrs();
</script>

<template>
  <USelectMenu
    v-model="internalModelValue"
    v-model:search-term="search"
    v-bind="attrs"
    :items="items"
    :loading="loading"
    :multiple="props.multiple"
    :ignore-filter="true"
    @update:open="$event && doSearch()"
  >
    <template v-for="(_, slotName) in $slots" #[slotName]="slotProps">
      <slot :name="slotName" v-bind="slotProps || {}"></slot>
    </template>
  </USelectMenu>
</template>
