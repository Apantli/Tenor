"use client";

import InputFileField from "~/app/_components/inputs/InputFileField";
import { useState } from "react";
import { api } from "~/trpc/react";
import { useParams } from "next/navigation";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import InputTextField from "~/app/_components/inputs/InputTextField";
import DeleteButton from "~/app/_components/buttons/DeleteButton";
import InputTextAreaField from "~/app/_components/inputs/InputTextAreaField";

export default function ProjectGeneralSettings() {
  const { projectId } = useParams();
  const [icon, setImage] = useState<File | null>(null);
  function handleImageChange(file: File) {
    setImage(file);
  }

  const { data: project } = api.projects.getGeneralConfig.useQuery({
    projectId: projectId as string,
  });

  return (
    <div className="flex h-full flex-col">
      <h1 className="mb-4 text-3xl font-bold">General</h1>
      <p className="mb-2 text-lg font-bold">Project icon</p>
      {project ? (
        <div className="flex h-full flex-col gap-y-3">
          <div className="flex flex-row gap-x-3">
            <img src={project.logo} alt="Project logo" className="h-20 w-20" />
            <InputFileField
              label=""
              accept="image/*"
              className="mt-auto h-12"
              image={icon}
              handleImageChange={handleImageChange}
            />
          </div>
          <InputTextField
            label="Project Name"
            className="mt-auto w-full"
            defaultValue={project.name}
            disabled
          />
          <InputTextAreaField
            label="Project Description"
            className="mt-auto w-full"
            defaultValue={project.name}
            disabled
          />

          <div className="mt-auto flex flex-col">
            <h3 className="mb-3 border-b-2 border-red-500 pb-2 text-2xl font-bold text-red-500">
              {" "}
              Danger Zone
            </h3>
            <div className="flex flex-row justify-between gap-x-28">
              <div className="flex flex-col">
                <p className="font-bold">Delete project</p>
                <p className="text-sm">Once deleted, you cannot recover it.</p>
              </div>
              <DeleteButton
                className="mt-auto"
                onClick={() => {
                  console.log("Delete project");
                }}
                loading={false}
                floatingSpinner={false}
              >
                Delete project
              </DeleteButton>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5 flex flex-row gap-x-3">
          <LoadingSpinner />
          <p className="text-lg font-bold">Loading...</p>
        </div>
      )}
    </div>
  );
}
