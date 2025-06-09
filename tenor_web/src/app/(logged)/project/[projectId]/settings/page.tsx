"use client";

import InputFileField from "~/app/_components/inputs/InputFileField";
import { useState, useEffect, useMemo, useContext } from "react";
import { api } from "~/trpc/react";
import { useParams, usePathname, useRouter } from "next/navigation";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import InputTextField from "~/app/_components/inputs/text/InputTextField";
import DeleteButton from "~/app/_components/inputs/buttons/DeleteButton";
import InputTextAreaField from "~/app/_components/inputs/text/InputTextAreaField";
import PrimaryButton from "~/app/_components/inputs/buttons/PrimaryButton";
import { useAlert } from "~/app/_hooks/useAlert";
import useConfirmation from "~/app/_hooks/useConfirmation";
import useNavigationGuard from "~/app/_hooks/useNavigationGuard";
import { checkPermissions } from "~/lib/defaultValues/permission";
import { emptyRole } from "~/lib/defaultValues/roles";
import {
  type Permission,
  permissionNumbers,
} from "~/lib/types/firebaseSchemas";
import useCharacterLimit from "~/app/_hooks/useCharacterLimit";
import { logoSizeLimit, logoMaxDimensions } from "~/lib/defaultValues/project";
import { toBase64 } from "~/lib/helpers/base64";
import { cn } from "~/lib/helpers/utils";
import { PageContext } from "~/app/_hooks/usePageContext";

export default function ProjectGeneralSettings() {
  const pathName = usePathname();
  const tab = pathName.split("/").pop();
  const { projectId } = useParams();
  const [icon, setIcon] = useState<File | null>(null);
  const [isValidatingImage, setIsValidatingImage] = useState(false);
  const [loadingImage, setLoadingImage] = useState<boolean>(true);

  function handleImageChange(file: File) {
    if (isValidatingImage) return;
    setIsValidatingImage(true);

    // Check file size
    if (file.size > logoSizeLimit) {
      predefinedAlerts.projectLogoSizeError();
      setIsValidatingImage(false);
      return;
    }

    // Check image dimensions
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);

      if (img.width > logoMaxDimensions || img.height > logoMaxDimensions) {
        predefinedAlerts.projectLogoDimensionsError(img.height, img.width);
        setIsValidatingImage(false);
      } else {
        // If all validations pass, set the image
        setIcon(file);
        const base64Image = (await toBase64(file)) as string;
        setEditForm((prev) => ({
          ...prev,
          icon: base64Image,
        }));
        setIsValidatingImage(false);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      predefinedAlerts.projectLogoError();
      setIsValidatingImage(false);
    };

    img.src = objectUrl;
  }
  const router = useRouter();
  const utils = api.useUtils();
  const { predefinedAlerts } = useAlert();

  const [mounted, setMouted] = useState(false);

  const { data: project, isLoading } = api.projects.getGeneralConfig.useQuery({
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

  const checkTitleLimit = useCharacterLimit("Title", 100);

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
    if (name === "name") {
      if (checkTitleLimit(e.target.value)) {
        setEditForm((prev) => ({
          ...prev,
          [name]: value,
        }));
      }
    } else {
      setEditForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const isModified = () => {
    return (
      (editForm.name !== project?.name ||
        editForm.icon !== project?.logo ||
        editForm.description !== project?.description) &&
      !isLoading
    );
  };

  useNavigationGuard(
    async () => {
      if (isModified()) {
        return !(await confirm(
          "Are you sure?",
          "You have unsaved changes. Do you want to leave?",
          "Discard changes",
          "Keep editing",
        ));
      }
      return false;
    },
    isModified(),
    "Are you sure you want to leave? You have unsaved changes.",
  );

  const { data: role } = api.settings.getMyRole.useQuery({
    projectId: projectId as string,
  });

  const permission: Permission = useMemo(() => {
    return checkPermissions(
      {
        flags: ["settings"],
      },
      role ?? emptyRole,
    );
  }, [role]);

  useEffect(() => {
    if (role?.id !== "owner" && tab == "settings") {
      router.push(`/project/${projectId as string}/settings/users`);
    } else {
      setMouted(true);
    }
  }, [role, tab, router]);

  const handleSave = async () => {
    if (!projectId) return;
    if (!editForm.name) {
      predefinedAlerts.projectNameError();
      return;
    }
    if (modifyingProject) return;
    await modifyProject({
      projectId: projectId as string,
      name: editForm.name,
      description: editForm.description,
      logo: editForm.icon,
    });
    await utils.projects.getGeneralConfig.invalidate();

    // update project in the cache
    setIcon(null);

    predefinedAlerts.projectSettingsSuccess();
    return;
  };

  // #region Page Context
  const pageContext = useContext(PageContext);
  const context = {
    ...pageContext,
    pageName: "Project Settings",
    "Project name Field": editForm.name,
    "Project description field": editForm.description,
  };

  // #endregion
  if (!mounted) {
    return <></>;
  }

  return (
    <PageContext.Provider value={context}>
      <div className="flex h-full flex-col lg:max-w-[600px]">
        <div className="flex flex-row justify-between">
          <h1 className="mb-4 text-3xl font-semibold">General</h1>
          {project && isModified() && (
            <PrimaryButton onClick={handleSave} loading={modifyingProject}>
              Save
            </PrimaryButton>
          )}
        </div>
        {project ? (
          <div className="flex h-full flex-col gap-2">
            <p className="mb-2 text-lg font-semibold">Project icon</p>
            <div className="flex flex-row gap-x-3">
              {loadingImage && (
                <div className="flex h-full w-full items-center justify-center">
                  <LoadingSpinner color="primary" />
                </div>
              )}
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
                onLoad={() => setLoadingImage(false)}
                onError={() => setLoadingImage(false)}
                alt="Project logo"
                className={cn(
                  "h-20 min-h-20 w-20 min-w-20 rounded-md border border-app-border object-contain p-1",
                  loadingImage ? "hidden" : "",
                )}
              />
              <InputFileField
                label=""
                accept="image/*"
                containerClassName="mt-auto h-12"
                image={icon}
                disabled={permission < permissionNumbers.write}
                handleImageChange={handleImageChange}
                displayText="Change project icon..."
              />
            </div>
            <InputTextField
              id="project-name-field"
              label="Project Name"
              className="w-full"
              labelClassName="text-lg font-semibold"
              value={editForm.name}
              name="name"
              disabled={permission < permissionNumbers.write}
              onChange={handleChange}
              placeholder="What is your project called..."
              containerClassName="mt-3"
            />
            <InputTextAreaField
              id="project-description-field"
              label="Project Description"
              labelClassName="text-lg font-semibold"
              className="h-[115px] w-full"
              value={editForm.description}
              name="description"
              disabled={permission < permissionNumbers.write}
              onChange={handleChange}
              placeholder="What is this project about..."
              containerClassName="mt-3"
            />
            <div className="mt-auto flex flex-col">
              <h3 className="mb-3 border-b-2 border-red-500 pb-2 text-2xl font-bold text-red-500">
                Danger Zone
              </h3>
              <div className="flex flex-row items-center justify-between gap-x-28">
                <div className="flex flex-col">
                  <p className="text-lg font-semibold">Delete project</p>
                  <p>Once deleted, you cannot recover it.</p>
                </div>
                <DeleteButton
                  onClick={async () => {
                    if (
                      !(await confirm(
                        "Delete project?",
                        "This action is not reversible",
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
                  disabled={permission < permissionNumbers.write}
                >
                  Delete project
                </DeleteButton>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-40 w-full justify-center">
            <LoadingSpinner color="primary" />
          </div>
        )}
      </div>
    </PageContext.Provider>
  );
}
