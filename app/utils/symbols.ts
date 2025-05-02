import type { InjectionKey, Ref } from "vue";

export const sidebarKey = Symbol() as InjectionKey<{
  open: Readonly<Ref<boolean>>;
  toggle: () => void;
}>;
