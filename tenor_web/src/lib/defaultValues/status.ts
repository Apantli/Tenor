import { type StatusTag } from "../types/firebaseSchemas";

export const todoTagName = "Todo";
export const doingTagName = "Doing";
export const doneTagName = "Done";
export const awaitsReviewTagName = "Awaits Review";
export const protectedNames = [
  todoTagName,
  doingTagName,
  doneTagName,
  awaitsReviewTagName,
];

export const awaitsReviewTag = {
  name: awaitsReviewTagName,
  color: "#FF4D00",
  deleted: false,
  marksTaskAsDone: false,
  orderIndex: 3,
};

export const defaultStatusTags = [
  {
    name: todoTagName,
    color: "#0737E3",
    deleted: false,
    marksTaskAsDone: false,
    orderIndex: 0,
  },
  {
    name: doingTagName,
    color: "#AD7C00",
    deleted: false,
    marksTaskAsDone: false,
    orderIndex: 1,
  },
  {
    name: doneTagName,
    color: "#009719",
    deleted: false,
    marksTaskAsDone: true,
    orderIndex: 2,
  },
  awaitsReviewTag,
];

export const automaticTag = {
  id: "",
  name: "Automatic",
  color: "#333333",
  deleted: false,
  orderIndex: -1,
  marksTaskAsDone: false,
};

export const isAutomatic = (status: StatusTag | undefined) => {
  return status === undefined || status.id === automaticTag.id;
};
