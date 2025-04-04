"use client";

import { useParams } from "next/navigation";
import { ProjectEpics } from "~/app/_components/sections/ProjectEpics";

export default function ProjectUserStories() {
  const { projectId } = useParams();
  return (
    <div className="flex flex-row gap-4">
      <div className="h-[80vh] w-96 border-r-2 pr-5 pt-6">
        <ProjectEpics projectId={projectId as string} />
      </div>
      <h1 className="text-2xl font-bold">User Stories</h1>
      {/* Popup to create epic */}
    </div>
  );
}
