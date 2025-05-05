<script setup lang="ts">
import { useNuxtApp } from "nuxt/app";
import { ref } from "vue";

import type { FormSubmitEvent } from "@nuxt/ui";
import UButton from "@nuxt/ui/runtime/components/Button.vue";
import UForm from "@nuxt/ui/runtime/components/Form.vue";
import UModal from "@nuxt/ui/runtime/components/Modal.vue";

import type { RouterOutputs } from "~/types/trpc";

type GroupReadOutput = RouterOutputs["group"]["read"];
type GroupDeleteOuput = RouterOutputs["group"]["delete"];

const props = defineProps<{
  id: string;
}>();

const emit = defineEmits<{ close: [{ group: GroupDeleteOuput | null; error: Error | null }] }>();

const { $client } = useNuxtApp();

const group = ref<GroupReadOutput>(await $client.group.read.query({ id: props.id }));

const onSubmit = async (_: FormSubmitEvent<unknown>) => {
  if (group.value) {
    try {
      group.value = await $client.group.delete.mutate({ id: group.value.id });
      emit("close", { group: group.value, error: null });
    } catch (error) {
      emit("close", { group: null, error: error as Error });
    }
  } else {
    emit("close", { group: null, error: new Error("Group not found") });
  }
};

const onCancel = () => {
  emit("close", { group: null, error: null });
};
</script>

<template>
  <UModal
    :title="$t('components.groups.deleteModal.title')"
    :description="$t('components.groups.deleteModal.description')"
    :close="false"
    :dismissible="false"
  >
    <template #body>
      <UForm :state="{}" class="w-full max-w-150 space-y-4" @submit="onSubmit">
        <div>{{ $t("components.groups.deleteModal.form.message", { name: group?.name }) }}</div>
        <div class="flex justify-end gap-2">
          <UButton type="button" icon="i-lucide-ban" color="neutral" variant="subtle" @click="onCancel">
            {{ $t("components.groups.deleteModal.form.cancel.label") }}
          </UButton>
          <UButton type="submit" icon="i-lucide-trash-2" color="error" variant="solid">
            {{ $t("components.groups.deleteModal.form.delete.label") }}
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
