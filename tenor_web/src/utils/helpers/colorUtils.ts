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

export const accentColorByCardType = {
  US: "bg-app-secondary",
  IS: "bg-yellow-500/80",
  TS: "bg-cyan-700",
  // IT: "bg-app-quaternary",
};
