"use client";

import { useParams } from "next/navigation";
import { api } from "~/trpc/react";

export default function ProjectOverview() {
  const { projectId } = useParams();
  const { data: role } = api.settings.getMyRole.useQuery({
    projectId: projectId as string,
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Project overview</h1>
      <p>Project Id: {projectId}</p>
      <p>My role: {role?.label}</p>
    </div>
  );
}
