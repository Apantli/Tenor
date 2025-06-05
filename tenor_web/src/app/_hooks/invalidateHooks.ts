// Use this hooks to invalidate the queries related to a specific item, task, project, etc.

import type { AnyBacklogItemType } from "~/lib/types/firebaseSchemas";
import { api } from "~/trpc/react";

export const useInvalidateQueriesAllTasks = () => {
  const utils = api.useUtils();
  return async (projectId: string, parentItemIds: string[] = []) => {
    await Promise.all([
      // Handle parent item invalidations
      ...parentItemIds.map((parentId) =>
        Promise.all([
          utils.tasks.getTaskTable.invalidate({
            projectId: projectId,
            itemId: parentId,
          }),
          utils.kanban.getItemAutomaticStatus.invalidate({
            projectId: projectId,
            itemId: parentId,
          }),
        ]),
      ),
      utils.kanban.getTasksForKanban.invalidate({
        projectId: projectId,
      }),
      utils.tasks.getTasksByDate.invalidate({
        projectId: projectId,
      }),
      // Invalidating this because items with automatic status fetch from tasks
      utils.kanban.getBacklogItemsForKanban.invalidate({
        projectId: projectId,
      }),
      utils.tasks.getTaskDependencies.invalidate({
        projectId: projectId,
      }),
      utils.projects.getActivityDetails.invalidate({
        projectId: projectId,
      }),
      utils.tasks.getTasks.invalidate({
        projectId: projectId,
      }),

      utils.projects.getActivityDetailsFromProjects.invalidate(),
      utils.projects.getTopProjectStatus.invalidate(),
    ]);
  };
};

export const useInvalidateQueriesTaskDetails = () => {
  const utils = api.useUtils();

  return async (projectId: string, taskIds: string[]) => {
    await Promise.all([
      utils.tasks.getTasksByDate.invalidate({
        projectId: projectId,
      }),
      utils.kanban.getTasksForKanban.invalidate({
        projectId: projectId,
      }),

      utils.projects.getActivityDetails.invalidate({
        projectId: projectId,
      }),
      utils.projects.getActivityDetailsFromProjects.invalidate(),
      utils.projects.getTopProjectStatus.invalidate(),
      ...taskIds.map((taskId) =>
        utils.tasks.getTaskDetail.invalidate({
          projectId: projectId,
          taskId,
        }),
      ),
    ]);
  };
};

export const useInvalidateQueriesAllEpics = () => {
  const utils = api.useUtils();
  return async (projectId: string) => {
    await Promise.all([
      utils.epics.getEpics.invalidate({
        projectId: projectId,
      }),
      utils.projects.getActivityDetails.invalidate({
        projectId: projectId,
      }),
    ]);
  };
};

export const useInvalidateQueriesAllUserStories = () => {
  const utils = api.useUtils();
  return async (projectId: string) => {
    await Promise.all([
      utils.userStories.getUserStoryTable.invalidate({
        projectId: projectId,
      }),
      utils.sprints.getBacklogItemPreviewsBySprint.invalidate({
        projectId: projectId,
      }),
      utils.kanban.getBacklogItemsForKanban.invalidate({
        projectId: projectId,
      }),
      utils.userStories.getUserStoryDependencies.invalidate({
        projectId: projectId,
      }),
      utils.projects.getActivityDetails.invalidate({
        projectId: projectId,
      }),
      utils.userStories.getUserStories.invalidate({
        projectId: projectId,
      }),
      utils.projects.getActivityDetailsFromProjects.invalidate(),
    ]);
  };
};

export const useInvalidateQueriesUserStoriesDetails = () => {
  const utils = api.useUtils();
  return async (projectId: string, userStoryIds: string[]) => {
    await Promise.all([
      utils.userStories.getUserStoryDependencies.invalidate({
        projectId: projectId,
      }),
      utils.projects.getActivityDetails.invalidate({
        projectId: projectId,
      }),
      utils.projects.getActivityDetailsFromProjects.invalidate(),
      utils.projects.getTopProjectStatus.invalidate(),
      ...userStoryIds.map((userStoryId) =>
        utils.userStories.getUserStoryDetail.invalidate({
          projectId: projectId,
          userStoryId,
        }),
      ),
    ]);
  };
};

export const useInvalidateQueriesItemStatus = () => {
  const utils = api.useUtils();
  return async (projectId: string) => {
    await Promise.all([
      utils.kanban.getTasksForKanban.invalidate({
        projectId: projectId,
      }),
      utils.kanban.getBacklogItemsForKanban.invalidate({
        projectId: projectId,
      }),
      utils.settings.getStatusTypes.invalidate({ projectId: projectId }),
      utils.projects.getTopProjectStatus.invalidate(),
    ]);
  };
};

export const useInvalidateQueriesAllRequirements = () => {
  const utils = api.useUtils();
  return async (projectId: string) => {
    await utils.requirements.getRequirementTable.invalidate({
      projectId: projectId,
    });
    await utils.projects.getActivityDetails.invalidate({
      projectId: projectId,
    });
    await utils.projects.getActivityDetailsFromProjects.invalidate();
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
    await utils.projects.getActivityDetails.invalidate({
      projectId: projectId,
    });
    await utils.projects.getActivityDetailsFromProjects.invalidate();
  };
};

export const useInvalidateQueriesAllIssues = () => {
  const utils = api.useUtils();
  return async (projectId: string) => {
    await Promise.all([
      utils.issues.getIssueTable.invalidate({
        projectId: projectId,
      }),
      utils.kanban.getBacklogItemsForKanban.invalidate({
        projectId: projectId,
      }),
      utils.sprints.getBacklogItemPreviewsBySprint.invalidate({
        projectId: projectId,
      }),
      utils.projects.getActivityDetails.invalidate({
        projectId: projectId,
      }),
      utils.projects.getActivityDetailsFromProjects.invalidate(),
      utils.projects.getTopProjectStatus.invalidate(),
    ]);
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
    await utils.projects.getActivityDetails.invalidate({
      projectId: projectId,
    });
    await utils.projects.getActivityDetailsFromProjects.invalidate();
    await utils.projects.getTopProjectStatus.invalidate();
  };
};

export const useInvalidateQueriesBacklogItems = () => {
  const invalidateQueriesAllUserStories = useInvalidateQueriesAllUserStories();
  const invalidateQueriesAllIssues = useInvalidateQueriesAllIssues();
  const invalidateQueriesAllEpics = useInvalidateQueriesAllEpics();
  const invalidateQueriesAllGenericBacklogItems =
    useInvalidateQueriesAllGenericBacklogItems();

  return async (projectId: string, itemType: AnyBacklogItemType | "EP") => {
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
      case "IT":
        await invalidateQueriesAllGenericBacklogItems(projectId);
        break;
    }
  };
};

interface CondenseItem {
  itemId: string;
  itemType: AnyBacklogItemType | "TS";
}

export const useInvalidateQueriesBacklogItemDetails = () => {
  const invalidateQueriesUserStoriesDetails =
    useInvalidateQueriesUserStoriesDetails();
  const invalidateQueriesIssueDetails = useInvalidateQueriesIssueDetails();
  const invalidateQueriesGenericBacklogItemDetails =
    useInvalidateQueriesGenericBacklogItemDetails();
  const invalidateQueriesTaskDetails = useInvalidateQueriesTaskDetails();

  return async (projectId: string, item: CondenseItem[]) => {
    const userStories = item.filter((i) => i.itemType === "US");
    const issues = item.filter((i) => i.itemType === "IS");
    const genericItems = item.filter((i) => i.itemType === "IT");
    const tasks = item.filter((i) => i.itemType === "TS");

    await Promise.all([
      invalidateQueriesUserStoriesDetails(
        projectId,
        userStories.map((i) => i.itemId),
      ),
      invalidateQueriesIssueDetails(
        projectId,
        issues.map((i) => i.itemId),
      ),
      invalidateQueriesGenericBacklogItemDetails(
        projectId,
        genericItems.map((i) => i.itemId),
      ),
      invalidateQueriesTaskDetails(
        projectId,
        tasks.map((i) => i.itemId),
      ),
    ]);
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
    await Promise.all([
      utils.settings.getBacklogTags.invalidate({
        projectId: projectId,
      }),
      utils.requirements.getRequirementFocuses.invalidate({
        projectId: projectId,
      }),
      utils.requirements.getRequirementTypes.invalidate({
        projectId: projectId,
      }),
    ]);
  };
};

export const useInvalidateQueriesAllStatuses = () => {
  const utils = api.useUtils();
  return async (projectId: string) => {
    await Promise.all([
      utils.settings.getStatusTypes.invalidate({
        projectId: projectId,
      }),
      utils.kanban.getBacklogItemsForKanban.invalidate({
        projectId,
      }),
      utils.kanban.getTasksForKanban.invalidate({
        projectId,
      }),
    ]);
  };
};

export const useInvalidateQueriesAllSprints = () => {
  const utils = api.useUtils();
  return async (projectId: string) => {
    await Promise.all([
      utils.sprints.getBacklogItemPreviewsBySprint.invalidate({
        projectId: projectId,
      }),
      utils.projects.getActivityDetails.invalidate({
        projectId: projectId,
      }),
      utils.sprints.getProjectSprintsOverview.invalidate({
        projectId: projectId,
      }),
    ]);
  };
};

export const useInvalidateQueriesSingleSprint = () => {
  const utils = api.useUtils();
  return async (projectId: string, sprintId: string) => {
    await utils.sprints.getSprint.invalidate({
      projectId: projectId,
      sprintId: sprintId,
    });
  };
};

export const useInvalidateQueriesUser = () => {
  const utils = api.useUtils();
  return async (userId: string) => {
    await Promise.all([
      utils.users.getGlobalUser.invalidate({
        userId: userId,
      }),
      utils.users.getGlobalUsers.invalidate(),
      utils.users.getTeamMembers.invalidate(),
      utils.users.getUserTable.invalidate(),
      utils.users.getUsers.invalidate(),
    ]);
  };
};

export const useInvalidateQueriesAllGenericBacklogItems = () => {
  const utils = api.useUtils();
  return async (projectId: string) => {
    await Promise.all([
      utils.backlogItems.getBacklogItems.invalidate({
        projectId: projectId,
      }),
      utils.sprints.getBacklogItemPreviewsBySprint.invalidate({
        projectId: projectId,
      }),
      utils.kanban.getBacklogItemsForKanban.invalidate({
        projectId: projectId,
      }),
      utils.projects.getActivityDetails.invalidate({
        projectId: projectId,
      }),
      utils.projects.getActivityDetailsFromProjects.invalidate(),
      utils.projects.getTopProjectStatus.invalidate(),
    ]);
  };
};

export const useInvalidateQueriesGenericBacklogItemDetails = () => {
  const utils = api.useUtils();

  return async (projectId: string, backlogItemIds: string[]) => {
    await Promise.all(
      backlogItemIds.map(async (backlogItemId) => {
        await utils.backlogItems.getBacklogItemDetail.invalidate({
          projectId: projectId,
          backlogItemId,
        });
      }),
    );

    await utils.projects.getActivityDetails.invalidate({
      projectId: projectId,
    });
    await utils.projects.getActivityDetailsFromProjects.invalidate();
    await utils.projects.getTopProjectStatus.invalidate();
  };
};

export const useInvalidateTeamMembers = () => {
  const utils = api.useUtils();
  return async (projectId: string) => {
    await utils.users.getTeamMembers.invalidate({
      projectId: projectId,
    });
  };
};
