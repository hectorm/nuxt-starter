export const Permissions = {
  Manage: "manage",
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];
