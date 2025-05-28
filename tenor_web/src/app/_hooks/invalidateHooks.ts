// Use this hooks to invalidate the queries related to a specific item, task, project, etc.

import type { BacklogItemType } from "~/lib/types/firebaseSchemas";
import { api } from "~/trpc/react";

export const useInvalidateQueriesAllTasks = () => {
  const utils = api.useUtils();
  return async (projectId: string, parentItemIds: string[] = []) => {
    await Promise.all(
      parentItemIds.map(async (parentId) => {
        await utils.tasks.getTaskTable.invalidate({
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

    await utils.tasks.getTaskDependencies.invalidate({
      projectId: projectId,
    });

    await utils.projects.getProjectActivities.invalidate({
      projectId: projectId,
    });

    await utils.projects.getActivityDetails.invalidate({
      projectId: projectId,
    });

    await utils.tasks.getTasks.invalidate({
      projectId: projectId,
    });
  };
};

export const useInvalidateQueriesTaskDetails = () => {
  const utils = api.useUtils();

  return async (projectId: string, taskIds: string[]) => {
    await utils.tasks.getTasksByDate.invalidate({
      projectId: projectId,
    });
    await utils.kanban.getTasksForKanban.invalidate({
      projectId: projectId,
    });
    await utils.projects.getProjectActivities.invalidate({
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

export const useInvalidateQueriesAllEpics = () => {
  const utils = api.useUtils();
  return async (projectId: string) => {
    await utils.epics.getEpics.invalidate({
      projectId: projectId,
    });

    await utils.projects.getProjectActivities.invalidate({
      projectId: projectId,
    });

    await utils.projects.getActivityDetails.invalidate({
      projectId: projectId,
    });
  };
};

export const useInvalidateQueriesAllUserStories = () => {
  const utils = api.useUtils();
  return async (projectId: string) => {
    await utils.userStories.getUserStoryTable.invalidate({
      projectId: projectId,
    });
    await utils.sprints.getBacklogItemPreviewsBySprint.invalidate({
      projectId: projectId,
    });
    await utils.kanban.getBacklogItemsForKanban.invalidate({
      projectId: projectId,
    });
    await utils.userStories.getUserStoryDependencies.invalidate({
      projectId: projectId,
    });
    await utils.projects.getProjectActivities.invalidate({
      projectId: projectId,
    });
    await utils.projects.getActivityDetails.invalidate({
      projectId: projectId,
    });
    await utils.userStories.getUserStories.invalidate({
      projectId: projectId,
    });
  };
};

export const useInvalidateQueriesUserStoriesDetails = () => {
  const utils = api.useUtils();
  return async (projectId: string, userStoryIds: string[]) => {
    await utils.userStories.getUserStoryDependencies.invalidate({
      projectId: projectId,
    });
    await utils.projects.getProjectActivities.invalidate({
      projectId: projectId,
    });
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
    await utils.requirements.getRequirementTable.invalidate({
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
    await utils.issues.getIssueTable.invalidate({
      projectId: projectId,
    });
    await utils.kanban.getBacklogItemsForKanban.invalidate({
      projectId: projectId,
    });
    await utils.sprints.getBacklogItemPreviewsBySprint.invalidate({
      projectId: projectId,
    });
    await utils.projects.getProjectActivities.invalidate({
      projectId: projectId,
    });
    await utils.projects.getActivityDetails.invalidate({
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
    await utils.projects.getProjectActivities.invalidate({
      projectId: projectId,
    });
  };
};

export const useInvalidateQueriesBacklogItems = () => {
  const utils = api.useUtils();
  const invalidateQueriesAllUserStories = useInvalidateQueriesAllUserStories();
  const invalidateQueriesAllIssues = useInvalidateQueriesAllIssues();
  const invalidateQueriesAllEpics = useInvalidateQueriesAllEpics();

  return async (projectId: string, itemType: BacklogItemType | "EP") => {
    switch (itemType) {
      case "US":
        await invalidateQueriesAllUserStories(projectId);
        break;
      case "EP":
        await invalidateQueriesAllEpics(projectId);
        break;
      case "IS":
        await invalidateQueriesAllIssues(projectId);
        break;
    }
    // TODO: Add one for general backlog items, when they are implemented
    await utils.projects.getProjectActivities.invalidate({
      projectId: projectId,
    });
  };
};

interface CondenseItem {
  itemId: string;
  itemType: BacklogItemType | "TS";
}

export const useInvalidateQueriesBacklogItemDetails = () => {
  const invalidateQueriesUserStoriesDetails =
    useInvalidateQueriesUserStoriesDetails();
  const invalidateQueriesIssueDetails = useInvalidateQueriesIssueDetails();
  const invalidateQueriesTaskDetails = useInvalidateQueriesTaskDetails();

  return async (projectId: string, item: CondenseItem[]) => {
    const userStories = item.filter((i) => i.itemType === "US");
    const issues = item.filter((i) => i.itemType === "IS");
    const tasks = item.filter((i) => i.itemType === "TS");

    await invalidateQueriesUserStoriesDetails(
      projectId,
      userStories.map((i) => i.itemId),
    );

    await invalidateQueriesIssueDetails(
      projectId,
      issues.map((i) => i.itemId),
    );

    await invalidateQueriesTaskDetails(
      projectId,
      tasks.map((i) => i.itemId),
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
    await utils.requirements.getRequirementFocuses.invalidate({
      projectId: projectId,
    });
    await utils.requirements.getRequirementTypes.invalidate({
      projectId: projectId,
    });
  };
};

export const useInvalidateQueriesAllStatuses = () => {
  const utils = api.useUtils();
  return async (projectId: string) => {
    await utils.settings.getStatusTypes.invalidate({
      projectId: projectId,
    });
  };
};

export const useInvalidateQueriesAllSprints = () => {
  const utils = api.useUtils();
  return async (projectId: string) => {
    await utils.sprints.getBacklogItemPreviewsBySprint.invalidate({
      projectId: projectId,
    });
    await utils.projects.getProjectActivities.invalidate({
      projectId: projectId,
    });
    await utils.projects.getActivityDetails.invalidate({
      projectId: projectId,
    });
  };
};

export const useInvalidateQueriesSingleSprint = () => {
  const utils = api.useUtils();
  return async (projectId: string, sprintId: string) => {
    await utils.sprints.getSprint.invalidate({
      projectId: projectId,
      sprintId: sprintId,
    });
    await utils.projects.getProjectActivities.invalidate({
      projectId: projectId,
    });
  };
};

// TODO: Add one for all other stuff and use it in code
