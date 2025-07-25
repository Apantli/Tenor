import type {
  ActionType,
  AllBasicItemType,
  BacklogItemAndTaskDetailType,
} from "~/lib/types/firebaseSchemas";

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
  type: AllBasicItemType | BacklogItemAndTaskDetailType,
): string {
  switch (type) {
    case "US":
      return "bg-app-secondary";
    case "IS":
      return "bg-yellow-500/80";
    case "IT":
      return "bg-sky-500";
    case "TS":
      return "bg-cyan-700";
    case "US-TS":
      return "bg-app-secondary-dark";
    case "IS-TS":
      return "bg-yellow-700/80";
    case "IT-TS":
      return "bg-sky-600";
    default:
      return "bg-app-secondary";
  }
}

// Used in activity overview for the tag colors
export function getAccentHexColorByCardType(type: AllBasicItemType): string {
  switch (type) {
    case "US":
      return "#16918A";
    case "IS":
      return "#EEC252";
    case "IT":
      return "#0FA6E9";
    case "TS":
      return "#0e7490";
    default:
      return "#13918A"; // TODO: Define all colors, not leave default
  }
}

export function getPillColorByActivityType(type: ActionType): string {
  switch (type) {
    case "create":
      return "#20C55E";
    case "update":
      return "#F59E0D";
    case "delete":
      return "#F04444";
  }
}

export const getBadContrastColorsText: Record<string, string> = {
  [getAccentHexColorByCardType("IS")]: "#80760C",
};
