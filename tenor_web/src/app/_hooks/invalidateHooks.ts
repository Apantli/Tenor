// Use this hooks to invalidate the queries related to a specific item, task, project, etc.

import type { itemTypes } from "~/lib/types/firebaseSchemas";
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
        await utils.kanban.getItemAutomaticStatus.invalidate({
          projectId: projectId,
          itemId: parentId,
        });
      }),
    );

    await utils.kanban.getTasksForKanban.invalidate({
      projectId: projectId,
    });

    // Invalidating this because items with automatic status fetch from tasks
    await utils.kanban.getBacklogItemsForKanban.invalidate({
      projectId: projectId,
    });
  };
};

export const useInvalidateQueriesTaskDetails = () => {
  const utils = api.useUtils();
  return async (projectId: string, taskIds: string[]) => {
    await utils.kanban.getTasksForKanban.invalidate({
      projectId: projectId,
    });
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
    await utils.kanban.getBacklogItemsForKanban.invalidate({
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

export const useInvalidateQueriesItemStatus = () => {
  const utils = api.useUtils();
  return async (projectId: string) => {
    await utils.kanban.getTasksForKanban.invalidate({
      projectId: projectId,
    });
    await utils.kanban.getBacklogItemsForKanban.invalidate({
      projectId: projectId,
    });
    await utils.settings.getStatusTypes.invalidate({ projectId: projectId });
  };
};

export const useInvalidateQueriesAllRequirements = () => {
  const utils = api.useUtils();
  return async (projectId: string) => {
    await utils.requirements.getRequirementsTableFriendly.invalidate({
      projectId: projectId,
    });
  };
};

export const useInvalidateQueriesRequirementDetails = () => {
  const utils = api.useUtils();
  return async (projectId: string, requirementIds: string[]) => {
    await Promise.all(
      requirementIds.map(async (requirementId) => {
        await utils.requirements.getRequirement.invalidate({
          projectId: projectId,
          requirementId,
        });
      }),
    );
  };
};

export const useInvalidateQueriesAllIssues = () => {
  const utils = api.useUtils();
  return async (projectId: string) => {
    await utils.issues.getIssuesTableFriendly.invalidate({
      projectId: projectId,
    });
    await utils.kanban.getBacklogItemsForKanban.invalidate({
      projectId: projectId,
    });
  };
};

export const useInvalidateQueriesIssueDetails = () => {
  const utils = api.useUtils();
  return async (projectId: string, issueIds: string[]) => {
    await Promise.all(
      issueIds.map(async (issueId) => {
        await utils.issues.getIssueDetail.invalidate({
          projectId: projectId,
          issueId,
        });
      }),
    );
  };
};

export const useInvalidateQueriesBacklogItems = () => {
  const invalidateQueriesAllUserStories = useInvalidateQueriesAllUserStories();
  const invalidateQueriesAllIssues = useInvalidateQueriesAllIssues();

  return async (projectId: string, itemType: itemTypes) => {
    if (itemType === "US") {
      await invalidateQueriesAllUserStories(projectId);
    } else if (itemType === "IS") {
      await invalidateQueriesAllIssues(projectId);
    }
    // TODO: Add one for general backlog items
  };
};

interface CondenseItem {
  itemId: string;
  itemType: itemTypes;
}

export const useInvalidateQueriesBacklogItemDetails = () => {
  const invalidateQueriesUserStoriesDetails =
    useInvalidateQueriesUserStoriesDetails();
  const invalidateQueriesIssueDetails = useInvalidateQueriesIssueDetails();

  return async (projectId: string, item: CondenseItem[]) => {
    const userStories = item.filter((i) => i.itemType === "US");
    const issues = item.filter((i) => i.itemType === "IS");

    await invalidateQueriesUserStoriesDetails(
      projectId,
      userStories.map((i) => i.itemId),
    );

    await invalidateQueriesIssueDetails(
      projectId,
      issues.map((i) => i.itemId),
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

export const useInvalidateQueriesAllTags = () => {
  const utils = api.useUtils();
  return async (projectId: string) => {
    await utils.settings.getBacklogTags.invalidate({
      projectId: projectId,
    });
  };
}

export const useInvalidateQueriesAllStatuses = () => {
  const utils = api.useUtils();
  return async (projectId: string) => {
    await utils.settings.getStatusTypes.invalidate({
      projectId: projectId,
    });
  };
};




// TODO: Add one for all other stuff and use it in code
