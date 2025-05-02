"use client";

import InputFileField from "~/app/_components/inputs/InputFileField";
import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { useParams, usePathname, useRouter } from "next/navigation";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import InputTextField from "~/app/_components/inputs/InputTextField";
import DeleteButton from "~/app/_components/buttons/DeleteButton";
import InputTextAreaField from "~/app/_components/inputs/InputTextAreaField";
import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import { useAlert } from "~/app/_hooks/useAlert";
import { toBase64 } from "~/utils/base64";
import useConfirmation from "~/app/_hooks/useConfirmation";
import useNavigationGuard from "~/app/_hooks/useNavigationGuard";

export default function ProjectGeneralSettings() {
  const pathName = usePathname();
  const tab = pathName.split("/").pop();
  const { projectId } = useParams();
  const [icon, setIcon] = useState<File | null>(null);
  const handleImageChange = async (file: File) => {
    const iconBase64 = (await toBase64(file)) as string;
    setIcon(file);
    setEditForm((prev) => ({
      ...prev,
      icon: iconBase64,
    }));
  };
  const router = useRouter();

  const utils = api.useUtils();

  const { alert } = useAlert();

  const { data: project } = api.projects.getGeneralConfig.useQuery({
    projectId: projectId as string,
  });
  const confirm = useConfirmation();

  const { mutateAsync: modifyProject, isPending: modifyingProject } =
    api.projects.modifyGeneralConfig.useMutation();

  const { mutateAsync: deleteProject, isPending: deletingProject } =
    api.projects.deleteProject.useMutation();

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
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const computeIsModified = () => {
    return (
      editForm.name !== project?.name ||
      (editForm.icon !== project?.logo && icon !== null) ||
      editForm.description !== project?.description
    );
  };

  useNavigationGuard(
    async () => {
      if (computeIsModified()) {
        return !(await confirm(
          "Are you sure?",
          "You have unsaved changes. Do you want to leave?",
          "Discard changes",
          "Keep editing",
        ));
      }
      return false;
    },
    computeIsModified(),
    "Are you sure you want to leave? You have unsaved changes.",
  );

  const { data: role } = api.settings.getMyRole.useQuery({
    projectId: projectId as string,
  });

  if (role?.id !== "owner" && tab == "project-settings") {
    router.push(`/project/${projectId as string}/project-settings/users`);
  }

  return (
    <div className="flex h-full max-w-[600px] flex-col">
      <div className="flex flex-row justify-between">
        <h1 className="mb-4 text-3xl font-semibold">General</h1>
        {project && computeIsModified() && (
          <PrimaryButton
            onClick={async () => {
              if (!projectId) return;
              if (!editForm.name) {
                alert("Oops...", "Please enter a project name.", {
                  type: "error",
                  duration: 5000, // time in ms (5 seconds)
                });
                return;
              }
              if (!modifyingProject) {
                await modifyProject({
                  projectId: projectId as string,
                  name: editForm.name,
                  description: editForm.description,
                  logo: editForm.icon,
                });
                await utils.projects.getGeneralConfig.invalidate();

                // update project in the cache
                setIcon(null);
              }
            }}
            loading={modifyingProject}
          >
            Save
          </PrimaryButton>
        )}
      </div>
      {project ? (
        <div className="flex h-full flex-col gap-y-8">
          <div>
            <p className="text-lg font-semibold">Project icon</p>
            <div className="flex flex-row gap-x-3">
              <img
                src={
                  editForm.icon == ""
                    ? undefined
                    : icon
                      ? URL.createObjectURL(icon)
                      : editForm.icon.startsWith("/")
                        ? editForm.icon
                        : `/api/image_proxy/?url=${encodeURIComponent(editForm.icon)}`
                }
                alt="Project logo"
                className="h-20 min-h-20 w-20 min-w-20 rounded-md border border-app-border object-contain p-1"
              />
              <InputFileField
                label=""
                accept="image/*"
                containerClassName="mt-auto h-12"
                image={icon}
                handleImageChange={handleImageChange}
                displayText="Change project icon..."
              />
            </div>
          </div>
          <InputTextField
            label="Project Name"
            className="mt-auto w-full"
            labelClassName="text-lg font-semibold"
            value={editForm.name}
            name="name"
            onChange={handleChange}
            placeholder="What is your project called..."
          />
          <InputTextAreaField
            label="Project Description"
            labelClassName="text-lg font-semibold"
            className="h-[115px] min-h-16 w-full"
            value={editForm.description}
            name="description"
            onChange={handleChange}
            placeholder="What is this project about..."
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
                className="mb-10 mt-auto"
                onClick={async () => {
                  if (
                    !(await confirm(
                      "Delete project?",
                      "This action is not revertible",
                      "Delete project",
                    ))
                  ) {
                    return;
                  }

                  if (!deletingProject) {
                    await deleteProject({
                      projectId: projectId as string,
                    });
                    await utils.projects.listProjects.invalidate();
                    router.push("/");
                  }
                }}
                loading={deletingProject}
                floatingSpinner={false}
              >
                Delete project
              </DeleteButton>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-40 w-full items-center justify-center">
          <LoadingSpinner color="primary" />
        </div>
      )}
    </div>
  );
}
