// TODO: in the future we're going to have more functionality here like being able to disable certain tabs based on role, showing tabs conditionally like sprint review, etc...
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
    flags: ["issues"],
  },
  calendar: {
    title: "Calendar",
    link: "/calendar",
    enabled: false,
    flags: ["scrumboard"],
  },
  performance: {
    title: "Performance",
    link: "/performance",
    enabled: false,
    flags: ["performance"],
  },
  settings: {
    title: "Project Settings",
    link: "/project-settings",
    enabled: true,
    flags: ["settings"],
  },
  sprintReview:{
    title: "Sprint Review",
    link: "/sprint-review",
    enabled: true,
    flags: ["sprints"],
  }
};
export const tabs = [
  "overview",
  "requirements",
  "userStories",
  "issues",
  "sprints",
  "scrumboard",
  "calendar",
  "performance",
  "settings",
  "sprintReview",
];
export const tabsToLinks = {
  requirements: "requirements",
  "user-stories": "userStories",
  issues: "issues",
  sprints: "sprints",
  scrumboard: "scrumboard",
  calendar: "calendar",
  performance: "performance",
  "project-settings": "settings",
  "sprint-review": "sprintReview",
};
