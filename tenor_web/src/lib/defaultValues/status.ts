export const todoTagName = "Todo";
export const doingTagName = "Doing";
export const doneTagName = "Done";

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
];
