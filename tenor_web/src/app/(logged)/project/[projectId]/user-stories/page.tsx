"use client";

import { ProjectEpics } from "~/app/_components/sections/ProjectEpics";
import UserStoryTable from "~/app/_components/sections/UserStoryTable";

export default function ProjectUserStories() {
  return (
    <div className="flex w-full flex-row gap-4">
      <div className="shrink-0 basis-[407px] border-r-2 pr-5 pt-0">
        <ProjectEpics />
      </div>
      <UserStoryTable />
    </div>
  );
}
