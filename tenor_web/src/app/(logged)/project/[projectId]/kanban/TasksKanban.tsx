"use client";

import { inferRouterOutputs } from "@trpc/server";
import type { sprintsRouter } from "~/server/api/routers/sprints";

export type UserStories = inferRouterOutputs<
  typeof sprintsRouter
>["getUserStoryPreviewsBySprint"]["userStories"];

export default function TasksKanban() {
  return (
    <div>
      <p className="">
        Hey
      </p>
      {/* Here goes the kanban view */}
    </div>
  );
}
