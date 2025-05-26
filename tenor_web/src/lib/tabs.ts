// TODO: in the future we're going to have more functionality here like being able to disable certain tabs based on role, showing tabs conditionally like sprint retrospective, etc...
export const tabsMetaInformation = {
  overview: {
    title: "Overview",
    link: "/",
    enabled: true,
    flags: ["backlog", "performance"],
  },
  requirements: {
    title: "Requirements",
    link: "/requirements",
    enabled: true,
    flags: ["backlog"],
  },
  userStories: {
    title: "User Stories",
    link: "/user-stories",
    enabled: true,
    flags: ["backlog"],
  },
  issues: {
    title: "Issues",
    link: "/issues",
    enabled: true,
    flags: ["issues"],
  },
  tasks: {
    title: "Tasks",
    link: "/tasks",
    enabled: true,
    flags: ["backlog", "issues"],
  },
  sprints: {
    title: "Sprints",
    link: "/sprints",
    enabled: true,
    flags: ["sprints"],
  },
  scrumboard: {
    title: "Scrum Board",
    link: "/scrumboard",
    enabled: true,
    flags: ["backlog", "issues"],
  },
  calendar: {
    title: "Calendar",
    link: "/calendar",
    enabled: true,
    flags: ["scrumboard"],
  },
  performance: {
    title: "Performance",
    link: "/performance",
    enabled: true,
    flags: ["performance"],
  },
  settings: {
    title: "Project Settings",
    link: "/project-settings",
    enabled: true,
    flags: ["settings"],
  },
  sprintRetrospective: {
    title: "Sprint Retrospective",
    link: "/sprint-retrospective",
    enabled: true,
    flags: ["retrospective"],
  },
};
export const tabs = [
  "overview",
  "requirements",
  "userStories",
  "issues",
  "sprints",
  "tasks",
  "scrumboard",
  "calendar",
  "performance",
  "settings",
  "sprintRetrospective",
];
export const tabsToLinks = {
  requirements: "requirements",
  "user-stories": "userStories",
  issues: "issues",
  sprints: "sprints",
  tasks: "tasks",
  scrumboard: "scrumboard",
  calendar: "calendar",
  performance: "performance",
  "project-settings": "settings",
  "sprint-retrospective": "sprintRetrospective",
};
