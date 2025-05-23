"use client";

import { api } from "~/trpc/react";
import {
  useInvalidateQueriesAllTasks,
  useInvalidateQueriesBacklogItems,
  useInvalidateQueriesTaskDetails,
  useInvalidateQueriesUserStoriesDetails,
} from "./invalidateHooks";
import type { AllBasicItemType } from "~/lib/types/firebaseSchemas";

// This also does all the necessary invalidations
export const useDeleteItemByType = () => {
  const { mutateAsync: deleteUserStory } =
    api.userStories.deleteUserStory.useMutation();
  const { mutateAsync: deleteIssue } = api.issues.deleteIssue.useMutation();
  const { mutateAsync: deleteTask } = api.tasks.deleteTask.useMutation();
  const { mutateAsync: deleteEpic } = api.epics.deleteEpic.useMutation();

  const invalidateQueriesUserStoriesDetails =
    useInvalidateQueriesUserStoriesDetails();
  const invalidateQueriesBacklogItems = useInvalidateQueriesBacklogItems();
  const invalidateQueriesAllTasks = useInvalidateQueriesAllTasks();
  const invalidateQueriesTaskDetails = useInvalidateQueriesTaskDetails();

  return async (
    projectId: string,
    itemType: AllBasicItemType,
    itemId: string,
    parentId?: string,
  ) => {
    switch (itemType) {
      case "US":
        const { updatedUserStoryIds, modifiedTaskIds: modifiedTaskIdsUs } =
          await deleteUserStory({
            projectId,
            userStoryId: itemId,
          });
        await invalidateQueriesUserStoriesDetails(
          projectId,
          updatedUserStoryIds,
        );
        await invalidateQueriesBacklogItems(projectId, itemType);
        await invalidateQueriesTaskDetails(projectId, modifiedTaskIdsUs);
        await invalidateQueriesAllTasks(projectId);
        break;

      case "IS":
        const { modifiedTaskIds: modifiedTaskIdsIs } = await deleteIssue({
          projectId,
          issueId: itemId,
        });
        await invalidateQueriesBacklogItems(projectId, itemType);
        await invalidateQueriesTaskDetails(projectId, modifiedTaskIdsIs);
        await invalidateQueriesAllTasks(projectId);
        break;

      case "TS":
        const { modifiedTaskIds } = await deleteTask({
          projectId,
          taskId: itemId,
        });
        if (parentId) {
          await invalidateQueriesAllTasks(projectId, [parentId]);
        }
        await invalidateQueriesTaskDetails(projectId, modifiedTaskIds);
        break;

      case "EP":
        await deleteEpic({ projectId, epicId: itemId });
        await invalidateQueriesBacklogItems(projectId, itemType);
        break;
    }
  };
};
