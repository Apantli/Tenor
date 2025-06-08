// TODO: in the future we're going to have more functionality here like being able to disable certain tabs based on role, showing tabs conditionally like sprint retrospective, etc...
export const tabsMetaInformation = {
  overview: {
    title: "Overview",
    link: "/",
    enabled: true,
    flags: ["overview"],
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
    flags: ["scrumboard"],
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
  retrospective: {
    title: "Retrospective",
    link: "/retrospective",
    enabled: true,
    flags: ["retrospective"],
  },
  settings: {
    title: "Settings",
    link: "/settings",
    enabled: true,
    flags: ["settings"],
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
  "retrospective",
  "settings",
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
  retrospective: "retrospective",
  settings: "settings",
};
