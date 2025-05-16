"use client";
import RequirementsTable from "~/app/_components/sections/RequirementsTable";
import { useParams } from "next/navigation";
import { api } from "~/trpc/react";

export default function ProjectRequirements() {

  const params = useParams();
  const projectId = params.projectId as string;

  const {data: projectInfo, isLoading} = api.projects.getGeneralConfig.useQuery({ projectId });

  const projectName = projectInfo?.name;
  const projectDescription = projectInfo?.description;
  const projectLogo = projectInfo?.logo;

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold">{projectName}</h1>
        <p className="text-gray-500">{projectDescription}</p>
      </div>
      <RequirementsTable />
    </div>
  );
}
