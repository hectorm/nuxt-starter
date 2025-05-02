<script setup lang="ts">
import { useNuxtApp } from "nuxt/app";
import { ref } from "vue";

import type { FormSubmitEvent } from "@nuxt/ui";
import UButton from "@nuxt/ui/runtime/components/Button.vue";
import UForm from "@nuxt/ui/runtime/components/Form.vue";
import UModal from "@nuxt/ui/runtime/components/Modal.vue";

import type { RouterOutputs } from "~/types/trpc";

type UserGetOutput = RouterOutputs["user"]["get"];
type UserDeleteOuput = RouterOutputs["user"]["delete"];

const props = defineProps<{
  id?: string;
}>();

const emit = defineEmits<{ close: [{ user: UserDeleteOuput | null; error: Error | null }] }>();

const { $client } = useNuxtApp();

const user = ref<UserGetOutput | null>(props.id ? await $client.user.get.query({ id: props.id }) : null);

const onSubmit = async (_: FormSubmitEvent<unknown>) => {
  if (user.value) {
    try {
      user.value = await $client.user.delete.mutate({ id: user.value.id });
      emit("close", { user: user.value, error: null });
    } catch (error) {
      emit("close", { user: null, error: error as Error });
    }
  } else {
    emit("close", { user: null, error: new Error("User not found") });
  }
};

const onCancel = () => {
  emit("close", { user: null, error: null });
};
</script>

<template>
  <UModal
    :title="$t('components.users.deleteModal.title')"
    :description="$t('components.users.deleteModal.description')"
    :close="false"
    :dismissible="false"
  >
    <template #body>
      <UForm :state="{}" class="w-full max-w-150 space-y-4" @submit="onSubmit">
        <div>{{ $t("components.users.deleteModal.form.message", { username: user?.username }) }}</div>
        <div class="flex justify-end gap-2">
          <UButton type="button" icon="i-lucide-ban" color="neutral" variant="subtle" @click="onCancel">
            {{ $t("components.users.deleteModal.form.cancel.label") }}
          </UButton>
          <UButton type="submit" icon="i-lucide-trash-2" color="error" variant="solid">
            {{ $t("components.users.deleteModal.form.delete.label") }}
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
