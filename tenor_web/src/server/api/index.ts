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

export { tasksRouter, aiRouter };
