<script setup lang="ts">
import Blockquote from "@tiptap/extension-blockquote";
import Bold from "@tiptap/extension-bold";
import BulletList from "@tiptap/extension-bullet-list";
import Code from "@tiptap/extension-code";
import CodeBlock from "@tiptap/extension-code-block";
import Document from "@tiptap/extension-document";
import Heading from "@tiptap/extension-heading";
import History from "@tiptap/extension-history";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Italic from "@tiptap/extension-italic";
import Link from "@tiptap/extension-link";
import ListItem from "@tiptap/extension-list-item";
import OrderedList from "@tiptap/extension-ordered-list";
import Paragraph from "@tiptap/extension-paragraph";
import Strike from "@tiptap/extension-strike";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import Text from "@tiptap/extension-text";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/vue-3";
import { useDebounceFn } from "@vueuse/core";
import { ref, watch } from "vue";

import UButton from "@nuxt/ui/runtime/components/Button.vue";
import UButtonGroup from "@nuxt/ui/runtime/components/ButtonGroup.vue";
import UInput from "@nuxt/ui/runtime/components/Input.vue";
import UPopover from "@nuxt/ui/runtime/components/Popover.vue";

import { htmlToMd } from "~/utils/html-to-md";
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
const emit = defineEmits(["update:modelValue"]);

const md = ref<string>(props.modelValue);
const activeLinkHref = ref<string>("");

const editor = useEditor({
  extensions: [
    Blockquote,
    Bold,
    BulletList,
    Code,
    CodeBlock,
    Document,
    Heading,
    History,
    HorizontalRule,
    Italic,
    Link.configure({ openOnClick: false }),
    ListItem,
    OrderedList,
    Paragraph,
    Strike,
    Table,
    TableCell,
    TableHeader,
    TableRow,
    Text,
    Underline,
  ],
  enableInputRules: false,
  enablePasteRules: false,
  content: await mdToHtml(md.value),
  onUpdate: useDebounceFn(async ({ editor }) => {
    md.value = await htmlToMd(editor.getHTML());
    emit("update:modelValue", md.value);
  }, props.refreshMs),
});

watch(
  () => props.modelValue,
  useDebounceFn(async (value) => {
    if (value !== md.value) {
      md.value = value;
      editor.value?.commands.setContent(await mdToHtml(md.value), false);
    }
  }, props.refreshMs),
);

const toggleHeading = (level: 1 | 2 | 3 | 4 | 5 | 6) => {
  editor.value?.chain().focus().toggleHeading({ level }).run();
};
const toggleBold = () => {
  editor.value?.chain().focus().toggleBold().run();
};
const toggleItalic = () => {
  editor.value?.chain().focus().toggleItalic().run();
};
const toggleUnderline = () => {
  editor.value?.chain().focus().toggleUnderline().run();
};
const toggleStrike = () => {
  editor.value?.chain().focus().toggleStrike().run();
};
const fillLinkInput = (fill: boolean) => {
  activeLinkHref.value = fill && editor.value?.isActive("link") ? editor.value?.getAttributes("link").href : "";
};
const setLink = () => {
  editor.value?.chain().focus().setLink({ href: activeLinkHref.value }).run();
};
const unsetLink = () => {
  editor.value?.chain().focus().unsetLink().run();
};
const toggleOrderedList = () => {
  editor.value?.chain().focus().toggleOrderedList().run();
};
const toggleBulletList = () => {
  editor.value?.chain().focus().toggleBulletList().run();
};
const toggleBlockquote = () => {
  editor.value?.chain().focus().toggleBlockquote().run();
};
const toggleCode = () => {
  editor.value?.chain().focus().toggleCode().run();
};
const toggleCodeBlock = () => {
  editor.value?.chain().focus().toggleCodeBlock().run();
};
const clearNodes = () => {
  editor.value?.chain().focus().clearNodes().unsetAllMarks().run();
};
</script>

<template>
  <div class="flex flex-col gap-2">
    <UButtonGroup>
      <UPopover>
        <UButton color="neutral" variant="ghost" icon="i-lucide-heading" />
        <template #content>
          <UButtonGroup>
            <UButton color="neutral" variant="ghost" icon="i-lucide-heading-1" @click="() => toggleHeading(1)" />
            <UButton color="neutral" variant="ghost" icon="i-lucide-heading-2" @click="() => toggleHeading(2)" />
            <UButton color="neutral" variant="ghost" icon="i-lucide-heading-3" @click="() => toggleHeading(3)" />
            <UButton color="neutral" variant="ghost" icon="i-lucide-heading-4" @click="() => toggleHeading(4)" />
            <UButton color="neutral" variant="ghost" icon="i-lucide-heading-5" @click="() => toggleHeading(5)" />
            <UButton color="neutral" variant="ghost" icon="i-lucide-heading-6" @click="() => toggleHeading(6)" />
          </UButtonGroup>
        </template>
      </UPopover>
      <UButton color="neutral" variant="ghost" icon="i-lucide-bold" @click="() => toggleBold()" />
      <UButton color="neutral" variant="ghost" icon="i-lucide-italic" @click="() => toggleItalic()" />
      <UButton color="neutral" variant="ghost" icon="i-lucide-underline" @click="() => toggleUnderline()" />
      <UButton color="neutral" variant="ghost" icon="i-lucide-strikethrough" @click="() => toggleStrike()" />
      <UPopover @update:open="(open) => fillLinkInput(open)">
        <UButton color="neutral" variant="ghost" icon="i-lucide-link" />
        <template #content>
          <UButtonGroup>
            <UInput v-model="activeLinkHref" @keypress.enter.prevent="() => setLink()" />
            <UButton color="neutral" variant="ghost" icon="i-lucide-link" @click="() => setLink()" />
            <UButton color="neutral" variant="ghost" icon="i-lucide-unlink" @click="() => unsetLink()" />
          </UButtonGroup>
        </template>
      </UPopover>
      <UButton color="neutral" variant="ghost" icon="i-lucide-list-ordered" @click="() => toggleOrderedList()" />
      <UButton color="neutral" variant="ghost" icon="i-lucide-list" @click="() => toggleBulletList()" />
      <UButton color="neutral" variant="ghost" icon="i-lucide-quote" @click="() => toggleBlockquote()" />
      <UButton color="neutral" variant="ghost" icon="i-lucide-terminal" @click="() => toggleCode()" />
      <UButton color="neutral" variant="ghost" icon="i-lucide-code" @click="() => toggleCodeBlock()" />
      <UButton color="neutral" variant="ghost" icon="i-lucide-remove-formatting" @click="() => clearNodes()" />
    </UButtonGroup>
    <EditorContent class="markdown-body [&_.tiptap]:outline-0" :editor="editor" />
  </div>
</template>
