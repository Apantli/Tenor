"use client";

import InputFileField from "~/app/_components/inputs/InputFileField";
import { useState } from "react";
import { api } from "~/trpc/react";
import { useParams } from "next/navigation";

export default function ProjectGeneralSettings() {
  const { projectId } = useParams();
  const [icon, setImage] = useState<File | null>(null);
  function handleImageChange(file: File) {
    setImage(file);
  }

  const { data: project } = api.projects.getGeneralConfig.useQuery({
    projectId: projectId as string,
  });

  console.log("Project general settings", project);

  return (
    <div className="flex flex-col">
      <h1 className="mb-4 text-3xl font-bold">General</h1>
      <p className="mb-2 text-lg font-bold">Project icon</p>
      <div className="flex flex-row gap-x-3">
        <img src="/colored_logo.png" alt="Project logo" className="h-20 w-20" />
        <InputFileField
          label=""
          accept="image/*"
          className="mt-auto h-12"
          image={icon}
          handleImageChange={handleImageChange}
        />
      </div>
    </div>
  );
}
