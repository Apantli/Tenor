"use client";

import { api } from "~/trpc/react";
import {
  useInvalidateQueriesAllTasks,
  useInvalidateQueriesBacklogItems,
  useInvalidateQueriesTaskDetails,
  useInvalidateQueriesUserStoriesDetails,
} from "./invalidateHooks";

// This also does all the necessary invalidations
export const useDeleteItemByType = () => {
  const { mutateAsync: deleteUserStory } =
    api.userStories.deleteUserStory.useMutation();
  const { mutateAsync: deleteTask } = api.tasks.deleteTask.useMutation();
  const { mutateAsync: deleteEpic } = api.epics.deleteEpic.useMutation();
  const invalidateQueriesUserStoriesDetails =
    useInvalidateQueriesUserStoriesDetails();
  const invalidateQueriesBacklogItems = useInvalidateQueriesBacklogItems();
  const invalidateQueriesAllTasks = useInvalidateQueriesAllTasks();

  // TODO: Implement this when dependencies for tasks are implemented
  const invalidateQueriesTaskDetails = useInvalidateQueriesTaskDetails();

  return async (
    projectId: string,
    itemType: "US" | "EP" | "TS",
    itemId: string,
    parentId?: string,
  ) => {
    switch (itemType) {
      case "US":
        const { updatedUserStoryIds } = await deleteUserStory({
          projectId,
          userStoryId: itemId,
        });
        await invalidateQueriesUserStoriesDetails(
          projectId,
          updatedUserStoryIds,
        );
        await invalidateQueriesBacklogItems(projectId, itemType);
        break;

      case "TS":
        const { updatedTaskIds } = await deleteTask({
          projectId,
          taskId: itemId,
        });
        if (parentId) {
          await invalidateQueriesAllTasks(projectId, [parentId]);
        }
        await invalidateQueriesTaskDetails(projectId, updatedTaskIds);
        break;

      case "EP":
        await deleteEpic({ projectId, epicId: itemId });
        await invalidateQueriesBacklogItems(projectId, itemType);
        break;
    }
  };
};
