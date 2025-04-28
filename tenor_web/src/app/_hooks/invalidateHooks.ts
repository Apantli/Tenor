// Use this hooks to invalidate the queries related to a specific item, task, project, etc.

import { api } from "~/trpc/react";

export const useInvalidateQueriesAllTasks = () => {
  const utils = api.useUtils();
  return async (projectId: string, parentItemIds: string[] = []) => {
    await Promise.all(
      parentItemIds.map(async (parentId) => {
        await utils.tasks.getTasksTableFriendly.invalidate({
          projectId: projectId,
          itemId: parentId,
        });
      }),
    );

    await utils.kanban.getTasksForKanban.invalidate({
      projectId: projectId,
    });
  };
};

export const useInvalidateQueriesTaskDetails = () => {
  const utils = api.useUtils();
  return async (projectId: string, taskIds: string[]) => {
    await Promise.all(
      taskIds.map(async (taskId) => {
        await utils.tasks.getTaskDetail.invalidate({
          projectId: projectId,
          taskId,
        });
      }),
    );
  };
};

export const useInvalidateQueriesAllUserStories = () => {
  const utils = api.useUtils();
  return async (projectId: string) => {
    await utils.userStories.getUserStoriesTableFriendly.invalidate({
      projectId: projectId,
    });
    await utils.userStories.getAllUserStoryPreviews.invalidate({
      projectId: projectId,
    });
    await utils.sprints.getUserStoryPreviewsBySprint.invalidate({
      projectId: projectId,
    });
  };
};

export const useInvalidateQueriesUserStoriesDetails = () => {
  const utils = api.useUtils();
  return async (projectId: string, userStoryIds: string[]) => {
    await Promise.all(
      userStoryIds.map(async (userStoryId) => {
        await utils.userStories.getUserStoryDetail.invalidate({
          projectId: projectId,
          userStoryId,
        });
      }),
    );
  };
};

export const useInvalidateQueriesScrumPreferences = () => {
  const utils = api.useUtils();
  return async (projectId: string) => {
    await utils.settings.fetchScrumSettings.invalidate({
      projectId: projectId,
    }); 
  };
};

// TODO: Add one for all other stuff and use it in code
