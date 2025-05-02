export const Roles = {
  Admin: "admin",
  User: "user",
} as const;

export type Role = (typeof Roles)[keyof typeof Roles];
