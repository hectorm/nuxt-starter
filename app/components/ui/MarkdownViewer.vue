<script setup lang="ts">
import { useDebounceFn } from "@vueuse/core";
import { ref, watch } from "vue";

import { mdToHtml } from "~/utils/md-to-html";

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    refreshMs?: number;
  }>(),
  {
    modelValue: "",
    refreshMs: 100,
  },
);

const md = ref<string>(props.modelValue);
const html = ref<string>(await mdToHtml(md.value));

watch(
  () => props.modelValue,
  useDebounceFn(async (value) => {
    if (value !== md.value) {
      md.value = value;
      html.value = await mdToHtml(md.value);
    }
  }, props.refreshMs),
);
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div class="markdown-body" v-html="html"></div>
</template>
