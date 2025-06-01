import { logsRouter } from "~/server/api/routers/logs";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { projectsRouter } from "./routers/projects";
import { fridaRouter } from "./routers/frida";
import { filesRouter } from "./routers/files";
import { authRouter } from "./routers/auth";
import { epicsRouter } from "./routers/epics";
import { userStoriesRouter } from "./routers/userStories";
import { userRouter } from "./routers/users";
import settingsRouter from "./routers/settings";
import { sprintsRouter } from "./routers/sprints";
import { tasksRouter } from "./routers/tasks";
import { issuesRouter } from "./routers/issues";
import { requirementsRouter } from "./routers/requirements";
import { kanbanRouter } from "./routers/kanban";
import { aiRouter } from "./routers/ai";
import { sprintRetrospectivesRouter } from "./routers/sprintRetrospectives";
import { performanceRouter } from "./routers/performance";
import { backlogItemsRouter } from "./routers/backlogItems";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  auth: authRouter,
  logs: logsRouter,
  projects: projectsRouter,
  userStories: userStoriesRouter,
  backlogItems: backlogItemsRouter,
  requirements: requirementsRouter,
  frida: fridaRouter,
  files: filesRouter,
  epics: epicsRouter,
  users: userRouter,
  settings: settingsRouter,
  sprints: sprintsRouter,
  sprintRetrospectives: sprintRetrospectivesRouter,
  tasks: tasksRouter,
  issues: issuesRouter,
  kanban: kanbanRouter,
  ai: aiRouter,
  performance: performanceRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
