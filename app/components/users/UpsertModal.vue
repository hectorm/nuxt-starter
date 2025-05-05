<script setup lang="ts">
import { useNuxtApp } from "nuxt/app";
import { reactive, ref } from "vue";
import { z } from "zod";

import type { FormSubmitEvent } from "@nuxt/ui";
import UButton from "@nuxt/ui/runtime/components/Button.vue";
import UForm from "@nuxt/ui/runtime/components/Form.vue";
import UFormField from "@nuxt/ui/runtime/components/FormField.vue";
import UInput from "@nuxt/ui/runtime/components/Input.vue";
import UModal from "@nuxt/ui/runtime/components/Modal.vue";
import USelectMenu from "@nuxt/ui/runtime/components/SelectMenu.vue";

import type { RouterInputs, RouterOutputs } from "~/types/trpc";

import SearchMenu from "~/components/SearchMenu.vue";

type UserReadOutput = RouterOutputs["user"]["read"];
type UserCreateInput = RouterInputs["user"]["create"];
type UserUpdateInput = RouterInputs["user"]["update"];
type UserCreateOrUpdateInput = UserCreateInput | UserUpdateInput;
type RoleListOutput = RouterOutputs["role"]["list"];

const props = defineProps<{
  id?: string | null;
}>();

const emit = defineEmits<{ close: [{ user: UserReadOutput | null; error: Error | null }] }>();

const { $client } = useNuxtApp();

const user = ref<UserReadOutput | null>(props.id ? await $client.user.read.query({ id: props.id }) : null);
const roles = ref<RoleListOutput>(await $client.role.list.query());

const schema = z.object({
  id: z.string().uuid().optional(),
  username: z.string().min(1),
  fullname: z.string().min(1),
  email: z.string().regex(/.+@.+/).min(1),
  roles: z.array(z.string().min(1)).optional(),
  groups: z.array(z.string().min(1)).optional(),
}) satisfies z.ZodType<UserCreateOrUpdateInput>;

const state = reactive<Partial<UserCreateOrUpdateInput>>({
  id: user.value?.id,
  username: user.value?.username,
  fullname: user.value?.fullname,
  email: user.value?.email,
  roles: user.value?.roles.map(({ role }) => role.name),
  groups: user.value?.groups.map(({ group }) => group.name),
});

const onSubmit = async (event: FormSubmitEvent<UserCreateOrUpdateInput>) => {
  try {
    user.value =
      "id" in event.data && event.data.id != null
        ? await $client.user.update.mutate(event.data as UserUpdateInput)
        : await $client.user.create.mutate(event.data as UserCreateInput);
    emit("close", { user: user.value, error: null });
  } catch (error) {
    emit("close", { user: null, error: error as Error });
  }
};

const onCancel = () => {
  emit("close", { user: null, error: null });
};
</script>

<template>
  <UModal
    :title="$t(`components.users.upsertModal.${props.id ? 'update' : 'create'}.title`)"
    :description="$t(`components.users.upsertModal.${props.id ? 'update' : 'create'}.description`)"
    :close="false"
    :dismissible="false"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        :validate-on="['change']"
        class="w-full max-w-150 space-y-4"
        @submit="onSubmit"
      >
        <UFormField name="username" :label="$t('components.users.upsertModal.form.username.label')" required>
          <UInput v-model="state.username" class="w-full" />
        </UFormField>
        <UFormField name="fullname" :label="$t('components.users.upsertModal.form.fullname.label')" required>
          <UInput v-model="state.fullname" class="w-full" />
        </UFormField>
        <UFormField name="email" :label="$t('components.users.upsertModal.form.email.label')" required>
          <UInput v-model="state.email" class="w-full" />
        </UFormField>
        <UFormField name="roles" :label="$t('components.users.upsertModal.form.roles.label')">
          <USelectMenu
            v-model="state.roles"
            :aria-label="$t('components.users.upsertModal.form.roles.label')"
            :items="roles.map((role) => role.name)"
            multiple
            class="w-full"
          />
        </UFormField>
        <UFormField name="groups" :label="$t('components.users.upsertModal.form.groups.label')">
          <SearchMenu
            v-model="state.groups"
            :aria-label="$t('components.users.upsertModal.form.groups.label')"
            :search-fn="(search) => $client.group.search.query({ search })"
            :map-fn="(result) => result.groups.map((group) => group.name)"
            multiple
            class="w-full"
          />
        </UFormField>
        <div class="flex justify-end gap-2">
          <UButton type="button" icon="i-lucide-ban" color="neutral" variant="subtle" @click="onCancel">
            {{ $t("components.users.upsertModal.form.cancel.label") }}
          </UButton>
          <UButton type="submit" icon="i-lucide-save" color="primary" variant="solid">
            {{ $t("components.users.upsertModal.form.save.label") }}
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
