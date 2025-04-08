"use client";

import { useParams } from "next/navigation";
import { ProjectEpics } from "~/app/_components/sections/ProjectEpics";
import UserStoryList, {
  heightOfContent,
} from "~/app/_components/sections/UserStoryList";
import { cn } from "~/lib/utils";

export default function ProjectUserStories() {
  const { projectId } = useParams();
  return (
    <div className="flex w-full flex-row gap-4">
      <div
        className={cn("min-w-[300px] border-r-2 pr-5 pt-1", heightOfContent)}
      >
        {/* TODO: Find an epic*/}
        <ProjectEpics projectId={projectId as string} />
      </div>
      <UserStoryList />
    </div>
  );
}
