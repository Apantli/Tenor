import type { Settings, Tag } from "../types/firebaseSchemas";

export const emptySettings: Settings = {
  sprintDuration: 0,
  aiContext: {
    text: "",
    files: [],
    links: [],
  },
  storyPointSizes: [
    1, // XS
    2, // S
    3, // M
    4, // L
    5, // XL
    6, // XXL
  ],
};

export const defaultSprintDuration = 7;

export const noTag: Tag = {
  id: "unknown",
  name: "Unknown",
  color: "#CCCCCC",
  deleted: false,
};

export const defaultActivity = [
  {
    itemId: "new project created",
    user: "",
    completitionDate: "",
    resolved: false,
  },
];

export const logoSizeLimit = 3 * 1024 * 1024; // 3MB in bytes
export const logoMaxDimensions = 1024; // Maximum width/height in pixels
