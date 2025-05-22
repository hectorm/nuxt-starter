<script setup lang="ts">
import { useNuxtApp } from "nuxt/app";
import { reactive, ref } from "vue";
import { z } from "zod/v4";

import type { FormSubmitEvent } from "@nuxt/ui";
import UButton from "@nuxt/ui/runtime/components/Button.vue";
import UForm from "@nuxt/ui/runtime/components/Form.vue";
import UFormField from "@nuxt/ui/runtime/components/FormField.vue";
import UInput from "@nuxt/ui/runtime/components/Input.vue";
import UModal from "@nuxt/ui/runtime/components/Modal.vue";
import USelectMenu from "@nuxt/ui/runtime/components/SelectMenu.vue";
import UTextarea from "@nuxt/ui/runtime/components/Textarea.vue";

import type { RouterInputs, RouterOutputs } from "~/types/trpc";

type GroupReadOutput = RouterOutputs["group"]["read"];
type GroupCreateInput = RouterInputs["group"]["create"];
type GroupUpdateInput = RouterInputs["group"]["update"];
type GroupCreateOrUpdateInput = GroupCreateInput | GroupUpdateInput;
type RoleListOutput = RouterOutputs["role"]["list"];

const props = defineProps<{
  id?: string | null;
}>();

const emit = defineEmits<{ close: [{ group: GroupReadOutput | null; error: Error | null }] }>();

const { $client } = useNuxtApp();

const group = ref<GroupReadOutput | null>(props.id ? await $client.group.read.query({ id: props.id }) : null);
const roles = ref<RoleListOutput>(await $client.role.list.query());

const schema = z.object({
  id: z.uuidv7().optional(),
  name: z.string().nonempty(),
  description: z.string().nullish(),
  roles: z.array(z.string().nonempty()).optional(),
}) satisfies z.ZodType<GroupCreateOrUpdateInput>;

const state = reactive<Partial<GroupCreateOrUpdateInput>>({
  id: group.value?.id,
  name: group.value?.name,
  description: group.value?.description,
  roles: group.value?.roles.map(({ role }) => role.name),
});

const onSubmit = async (event: FormSubmitEvent<GroupCreateOrUpdateInput>) => {
  try {
    group.value =
      "id" in event.data && event.data.id != null
        ? await $client.group.update.mutate(event.data as GroupUpdateInput)
        : await $client.group.create.mutate(event.data as GroupCreateInput);
    emit("close", { group: group.value, error: null });
  } catch (error) {
    emit("close", { group: null, error: error as Error });
  }
};

const onCancel = () => {
  emit("close", { group: null, error: null });
};
</script>

<template>
  <UModal
    :title="$t(`components.groups.upsertModal.${props.id ? 'update' : 'create'}.title`)"
    :description="$t(`components.groups.upsertModal.${props.id ? 'update' : 'create'}.description`)"
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
        <UFormField name="name" :label="$t('components.groups.upsertModal.form.name.label')" required>
          <UInput v-model="state.name" class="w-full" />
        </UFormField>
        <UFormField name="description" :label="$t('components.groups.upsertModal.form.description.label')">
          <UTextarea v-model="state.description" class="w-full" :maxrows="10" autoresize />
        </UFormField>
        <UFormField name="roles" :label="$t('components.groups.upsertModal.form.roles.label')">
          <USelectMenu
            v-model="state.roles"
            :aria-label="$t('components.groups.upsertModal.form.roles.label')"
            :items="roles.map((role) => role.name)"
            multiple
            class="w-full"
          />
        </UFormField>
        <div class="flex justify-end gap-2">
          <UButton type="button" icon="i-lucide-ban" color="neutral" variant="subtle" @click="onCancel">
            {{ $t("components.groups.upsertModal.form.cancel.label") }}
          </UButton>
          <UButton type="submit" icon="i-lucide-save" color="primary" variant="solid">
            {{ $t("components.groups.upsertModal.form.save.label") }}
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
