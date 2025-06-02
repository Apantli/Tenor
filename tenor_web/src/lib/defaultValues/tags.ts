import type { Tag, WithId } from "../types/firebaseSchemas";

export const defaultRequerimentTypes = [
  {
    name: "Functional",
    color: "#24A5BC",
    deleted: false,
  },
  {
    name: "Non Functional",
    color: "#CD4EC0",
    deleted: false,
  },
];

export const defaultPriorityTypes = [
  {
    name: "P0",
    color: "#FF0000",
    deleted: false,
  },
  {
    name: "P1",
    color: "#d1b01d",
    deleted: false,
  },
  {
    name: "P2",
    color: "#2c7817",
    deleted: false,
  },
];

export const noneSelectedTag: WithId<Tag> = {
  id: "",
  name: "None",
  color: "#333333",
  deleted: false,
};
