<script setup lang="ts">
import { definePageMeta } from "#imports";

definePageMeta({
  title: "pages.settings.general.title",
  description: "pages.settings.general.description",
  middleware: ["auth", "can"],
  permissions: ["manage"],
});
</script>

<template>
  <div class="flex flex-col"></div>
</template>
