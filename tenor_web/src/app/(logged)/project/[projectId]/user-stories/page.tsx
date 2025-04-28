"use client";

import { useParams } from "next/navigation";
import { ProjectEpics } from "~/app/_components/sections/ProjectEpics";
import UserStoryList from "~/app/_components/sections/UserStoryList";

export default function ProjectUserStories() {
  const { projectId } = useParams();
  return (
    <div className="flex w-full flex-row gap-4">
      <div className="shrink-0 basis-[407px] border-r-2 pr-5 pt-0">
        <ProjectEpics projectId={projectId as string} />
      </div>
      <UserStoryList />
    </div>
  );
}
