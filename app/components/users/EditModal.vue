<script setup lang="ts">
import { useNuxtApp } from "nuxt/app";
import { reactive, ref, resolveComponent } from "vue";
import { z } from "zod";

import type { FormSubmitEvent } from "@nuxt/ui";
import UButton from "@nuxt/ui/runtime/components/Button.vue";
import UForm from "@nuxt/ui/runtime/components/Form.vue";
import UFormField from "@nuxt/ui/runtime/components/FormField.vue";
import UInput from "@nuxt/ui/runtime/components/Input.vue";
import UModal from "@nuxt/ui/runtime/components/Modal.vue";

import type { RouterInputs, RouterOutputs } from "~/types/trpc";

type UserGetOutput = RouterOutputs["user"]["get"];
type UserSetInput = RouterInputs["user"]["set"];
type RoleOutput = RouterOutputs["role"]["getAll"];

// https://github.com/nuxt/ui/issues/2968
const USelectMenu = resolveComponent("USelectMenu");

const props = defineProps<{
  id?: string;
}>();

const emit = defineEmits<{ close: [{ user: UserGetOutput | null; error: Error | null }] }>();

const { $client } = useNuxtApp();

const user = ref<UserGetOutput | null>(props.id ? await $client.user.get.query({ id: props.id }) : null);
const roles = ref<RoleOutput>(await $client.role.getAll.query());

const schema = z.object({
  id: z.string().uuid(),
  fullname: z.string().min(1),
  username: z.string().min(1),
  email: z.string().regex(/.+@.+/).min(1),
  roles: z.array(z.string().min(1)).min(1),
}) satisfies z.ZodType<UserSetInput>;

const state = reactive<Partial<UserSetInput>>({
  id: user.value?.id,
  fullname: user.value?.fullname,
  username: user.value?.username,
  email: user.value?.email,
  roles: user.value?.roles.map(({ role }) => role.name),
});

const onSubmit = async (event: FormSubmitEvent<UserSetInput>) => {
  if (user.value) {
    try {
      user.value = await $client.user.set.mutate(event.data);
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
    :title="$t('components.users.editModal.title')"
    :description="$t('components.users.editModal.description')"
    :close="false"
    :dismissible="false"
  >
    <template #body>
      <UForm :schema="schema" :state="state" class="w-full max-w-150 space-y-4" @submit="onSubmit">
        <UFormField name="username" :label="$t('components.users.editModal.form.username.label')" required>
          <UInput v-model="state.username" class="w-full" />
        </UFormField>
        <UFormField name="fullname" :label="$t('components.users.editModal.form.fullname.label')" required>
          <UInput v-model="state.fullname" class="w-full" />
        </UFormField>
        <UFormField name="email" :label="$t('components.users.editModal.form.email.label')" required>
          <UInput v-model="state.email" class="w-full" />
        </UFormField>
        <UFormField name="roles" :label="$t('components.users.editModal.form.roles.label')" required>
          <USelectMenu
            v-model="state.roles"
            :aria-label="$t('components.users.editModal.form.roles.label')"
            :items="roles.map((role) => role.name)"
            multiple
            class="w-full"
          />
        </UFormField>
        <div class="flex justify-end gap-2">
          <UButton type="button" icon="i-lucide-ban" color="neutral" variant="subtle" @click="onCancel">
            {{ $t("components.users.editModal.form.cancel.label") }}
          </UButton>
          <UButton type="submit" icon="i-lucide-save" color="primary" variant="solid">
            {{ $t("components.users.editModal.form.save.label") }}
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
