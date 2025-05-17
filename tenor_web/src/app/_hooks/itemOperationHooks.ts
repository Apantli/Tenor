"use client";

import { api } from "~/trpc/react";

export const useDeleteItemByType = () => {
  const { mutateAsync: deleteUserStory } =
    api.userStories.deleteUserStory.useMutation();
  const { mutateAsync: deleteTask } = api.tasks.deleteTask.useMutation();
  const { mutateAsync: deleteEpic } = api.epics.deleteEpic.useMutation();

  return async (
    projectId: string,
    itemType: "US" | "EP" | "TS",
    itemId: string,
  ) => {
    switch (itemType) {
      case "US":
        await deleteUserStory({ projectId, userStoryId: itemId });
        break;
      case "TS":
        await deleteTask({ projectId, taskId: itemId });
        break;
      case "EP":
        await deleteEpic({ projectId, epicId: itemId });
        break;
    }
  };
};
