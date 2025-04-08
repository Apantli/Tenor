"use client";

import InputFileField from "~/app/_components/inputs/InputFileField";
import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { useParams } from "next/navigation";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import InputTextField from "~/app/_components/inputs/InputTextField";
import DeleteButton from "~/app/_components/buttons/DeleteButton";
import InputTextAreaField from "~/app/_components/inputs/InputTextAreaField";
import PrimaryButton from "~/app/_components/buttons/PrimaryButton";

export default function ProjectGeneralSettings() {
  const { projectId } = useParams();
  const [icon, setImage] = useState<File | null>(null);
  function handleImageChange(file: File) {
    setImage(file);
  }

  const { data: project } = api.projects.getGeneralConfig.useQuery({
    projectId: projectId as string,
  });

  const [editForm, setEditForm] = useState({
    name: "",
    icon: "",
    description: "",
  });

  useEffect(() => {
    if (project) {
      setEditForm({
        name: project.name,
        icon: project.logo,
        description: project.description,
      });
    }
  }, [project]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    console.log(name, value);
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const isModified = () => {
    return (
      editForm.name !== project?.name ||
      editForm.icon !== project?.logo ||
      editForm.description !== project?.description
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-row justify-between">
        <h1 className="mb-4 text-3xl font-bold">General</h1>
        {project && isModified() && <PrimaryButton>Save</PrimaryButton>}
      </div>
      <p className="mb-2 text-lg font-bold">Project icon</p>
      {project ? (
        <div className="flex h-full flex-col gap-y-8">
          <div className="flex flex-row gap-x-3">
            <img src={editForm.icon} alt="Project logo" className="h-20 w-20" />
            <InputFileField
              label=""
              accept="image/*"
              containerClassName="mt-auto h-12"
              image={icon}
              handleImageChange={handleImageChange}
              displayText="Change project icon..."
            />
          </div>
          <InputTextField
            label="Project Name"
            className="mt-auto w-full"
            labelClassName="text-lg font-bold"
            value={editForm.name}
            name="name"
            onChange={handleChange}
          />
          <InputTextAreaField
            label="Project Description"
            labelClassName="text-lg font-bold"
            className="mt-auto w-full"
            value={editForm.description}
            name="description"
            onChange={handleChange}
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
