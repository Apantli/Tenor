"use client";

import { useParams } from "next/navigation";
import { ProjectSprintsManager } from "~/app/_components/sections/ProjectSprintsManager";
import { cn } from "~/lib/utils";

export default function ProjectSprints() {
  const { projectId } = useParams();
  return (
    <div className="flex w-full flex-row gap-4">
      <div className={cn("min-w-[300px] border-r-2 pr-5 pt-6")}>
        {/* Product Backlog */}
      </div>
      <ProjectSprintsManager projectId={projectId as string} />
      {/* Popup to create sprint */}
    </div>
  );
}
