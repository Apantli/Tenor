import type { BacklogItemAndTaskDetailType } from "~/lib/types/firebaseSchemas";

export const acceptableTagColors = [
  "#d9543d",
  "#bf5513",
  "#998e17",
  "#6a8714",
  "#2d7513",
  "#3b8f58",
  "#4b8073",
  "#197574",
  "#66b3b1",
  "#4599ba",
  "#4572ba",
  "#4551ba",
  "#826fd9",
  "#a76fd9",
  "#d34de8",
  "#e84dd1",
  "#a12362",
  "#e31b7f",
  "#e31b36",
  "#524849",
] as const;

export function generateRandomTagColor(): string {
  const randomIndex = Math.floor(Math.random() * acceptableTagColors.length);
  return acceptableTagColors[randomIndex] ?? "#d9543d";
}

export function getAccentColorByCardType(
  type: BacklogItemAndTaskDetailType,
): string {
  switch (type) {
    case "US":
      return "bg-app-secondary";
    case "IS":
      return "bg-yellow-500/80";
    case "US-TS":
      return "bg-cyan-700";
    case "IS-TS":
      return "bg-yellow-700/80";
    default:
      return "bg-app-secondary";
  }
}
