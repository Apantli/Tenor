import { FlagsRequired } from "~/lib/defaultProjectValues";

export const tagPermissions: FlagsRequired = {
  flags: ["settings", "backlog"],
  optimistic: true,
};

export const backlogPermissions: FlagsRequired = {
  flags: ["backlog"],
  optimistic: true,
};
