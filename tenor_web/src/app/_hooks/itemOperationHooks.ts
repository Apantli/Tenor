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
  const invalidateQueriesTaskDetails = useInvalidateQueriesTaskDetails();

  return async (
    projectId: string,
    itemType: "US" | "EP" | "TS",
    itemId: string,
    parentId?: string,
  ) => {
    switch (itemType) {
      case "US":
        const { updatedUserStoryIds, updatedTaskIds: updatedTaskIds1 } =
          await deleteUserStory({
            projectId,
            userStoryId: itemId,
          });
        await invalidateQueriesUserStoriesDetails(
          projectId,
          updatedUserStoryIds,
        );
        await invalidateQueriesBacklogItems(projectId, itemType);
        await invalidateQueriesTaskDetails(projectId, updatedTaskIds1);
        break;

      case "TS":
        const { updatedTaskIds: updatedTaskIds2 } = await deleteTask({
          projectId,
          taskId: itemId,
        });
        if (parentId) {
          await invalidateQueriesAllTasks(projectId, [parentId]);
        }
        await invalidateQueriesTaskDetails(projectId, updatedTaskIds2);
        break;

      case "EP":
        await deleteEpic({ projectId, epicId: itemId });
        await invalidateQueriesBacklogItems(projectId, itemType);
        break;
    }
  };
};
