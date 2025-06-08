"use client";
import PrimaryButton from "~/app/_components/inputs/buttons/PrimaryButton";
import Navbar from "~/app/_components/Navbar";
import Link from "next/link";
import Tabbar from "~/app/_components/Tabbar";
import InputTextField from "~/app/_components/inputs/text/InputTextField";
import InputTextAreaField from "~/app/_components/inputs/text/InputTextAreaField";
import InputFileField from "~/app/_components/inputs/InputFileField";
import LinkList from "~/app/_components/inputs/LinkList";
import FileList from "~/app/_components/inputs/FileList";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "~/trpc/react";
import { useAlert } from "~/app/_hooks/useAlert";
import { type Links } from "~/server/api/routers/settings";
import { toBase64 } from "~/lib/helpers/base64";
import type { UserCol } from "~/lib/types/columnTypes";
import MemberTable from "~/app/_components/inputs/MemberTable";
import type { UserPreview } from "~/lib/types/detailSchemas";
import type { WithId } from "~/lib/types/firebaseSchemas";
import { defaultRoleList, emptyRole } from "~/lib/defaultValues/roles";
import { env } from "~/env";
import AIDisclaimer from "~/app/_components/helps/predefined/AIDisclaimer";
import { PageContext } from "~/app/_hooks/usePageContext";
import { logoSizeLimit, logoMaxDimensions } from "~/lib/defaultValues/project";

export default function ProjectCreator() {
  const utils = api.useUtils();

  const router = useRouter();
  const { mutateAsync: createProject, isPending } =
    api.projects.createProject.useMutation();

  const { predefinedAlerts } = useAlert();
  const handleCreateProject = async () => {
    // Block project creation if there is a pending request
    if (isPending) {
      return;
    }

    if (!form.name) {
      predefinedAlerts.projectNameError();
      return;
    }

    let logoBase64Encoded: string | undefined = undefined;
    if (icon) {
      logoBase64Encoded = (await toBase64(icon)) as string;
    }

    const filesBase64Encoded: {
      name: string;
      type: string;
      content: string;
      size: number;
    }[] = [];

    for (const file of files) {
      const fileBase64 = (await toBase64(file)) as string;
      filesBase64Encoded.push({
        name: file.name,
        type: file.type,
        content: fileBase64,
        size: file.size,
      });
    }

    const response = await createProject({
      name: form.name,
      description: form.description,
      logo: logoBase64Encoded ?? "",
      users: teamMembers.map((member) => ({
        userId: member.id,
        roleId: member.roleId,
      })),
      settings: {
        aiContext: {
          text: form.context,
          files: filesBase64Encoded,
          links: links,
        },
      },
    });

    if (response.success) {
      router.push(`/project/${response.projectId}`);
      await utils.projects.listProjects.invalidate();
    } else {
      predefinedAlerts.projectCreateError();
    }
  };

  const [form, setForm] = useState({
    name: "",
    description: "",
    context: "",
  });

  const [teamMembers, setTeamMembers] = useState<UserCol[]>([]);
  const handleRemoveTeamMember = (id: (string | number)[]) => {
    setTeamMembers((prev) => prev.filter((member) => !id.includes(member.id)));
  };
  const handleAddTeamMember = (user: WithId<UserPreview>) => {
    setTeamMembers((prev) => [...prev, { ...user, roleId: emptyRole.id }]);
  };
  const handleEditMemberRole = (id: string, role: string) => {
    setTeamMembers((prev) =>
      prev.map((member) => {
        if (member.id === id) {
          return {
            ...member,
            roleId: role,
          };
        }
        return member;
      }),
    );
  };

  const [icon, setImage] = useState<File | null>(null);
  const [isValidatingImage, setIsValidatingImage] = useState(false);

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

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      if (img.width > logoMaxDimensions || img.height > logoMaxDimensions) {
        predefinedAlerts.projectLogoDimensionsError(img.height, img.width);
        setIsValidatingImage(false);
      } else {
        // If all validations pass, set the image
        setImage(file);
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

  // Context Files
  const [files, setFiles] = useState<File[]>([]);
  function handleFilesAdd(files: File[]) {
    setFiles((prev) => [...prev, ...files]);
  }
  function handleFilesDelete(file: File) {
    setFiles((prev) => prev.filter((f) => f !== file));
  }

  const [links, setLinks] = useState<Links[]>([]);
  function handleLinkAdd(link: Links) {
    // Check if the link already exists
    if (links.some((l) => l.link === link.link)) {
      predefinedAlerts.linkExistsError();
      return;
    } else {
      setLinks((prev) => [...prev, link]);
    }
  }
  function handleLinkDelete(link: Links) {
    setLinks((prev) => prev.filter((l) => l.link !== link.link));
  }

  const maxProjectNameLength = 100;
  const [nameWarningShown, setNameWarningShown] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    if (
      name === "name" &&
      value.length > maxProjectNameLength &&
      !nameWarningShown
    ) {
      predefinedAlerts.projectNameLengthError(
        maxProjectNameLength.toLocaleString(),
      );
      setNameWarningShown(true);
    }

    if (name === "name" && value.length <= maxProjectNameLength) {
      setNameWarningShown(false);
    }

    setForm((prev) => ({
      ...prev,
      [name]: name === "name" ? value.slice(0, maxProjectNameLength) : value,
    }));
  };

  const context = {
    pageName: "Project Creator",
    pageDescription: "Create a new project with all necessary details.",
    project_name: form.name,
    project_description: form.description,
    project_context: form.context,
  };

  return (
    <PageContext.Provider value={context}>
      <div className="flex h-screen flex-col overflow-y-auto">
        <Navbar>
          <div className="flex gap-1">
            <Link href="/" className="font-semibold">
              Projects
            </Link>
            <span>/ New Project</span>
          </div>
        </Navbar>
        <Tabbar disabled mainPageName="Project Creator" />
        <main className="m-6 p-4">
          <div className="header flex w-full items-center justify-between pb-6">
            <h1 className="text-2xl font-semibold">Project Creator</h1>
            <PrimaryButton
              onClick={handleCreateProject}
              loading={isPending}
              data-cy="create-project-button"
            >
              Generate Project
            </PrimaryButton>
          </div>
          <hr />
          <div className="content flex w-full gap-4 pt-6">
            <div className="flex min-w-[45%] flex-col gap-y-4">
              <div className="flex flex-wrap gap-4">
                {/* Project Name */}
                <div className="min-w-[300px] flex-1">
                  <InputTextField
                    id="project-name-field"
                    label={`Project Name (${form.name.length}/${maxProjectNameLength})`}
                    value={form.name}
                    onChange={handleChange}
                    name="name"
                    placeholder="What is your project called..."
                    labelClassName="text-lg font-semibold"
                    data-cy="project-name-input"
                  />
                </div>

                {/* Project Icon */}
                <div className="flex-1">
                  <InputFileField
                    label="Icon (max: 3MB)"
                    labelClassName="text-lg font-semibold"
                    className="mt-1"
                    accept="image/*"
                    image={icon}
                    handleImageChange={handleImageChange}
                  />
                </div>
              </div>

              {/* Project Description */}
              <InputTextAreaField
                id="project-description-field"
                label="Description"
                html-rows="4"
                placeholder="What is this project about..."
                className="min-h-[140px] w-full"
                value={form.description}
                onChange={handleChange}
                name="description"
                labelClassName="text-lg font-semibold"
                data-cy="project-description-input"
              />

              {/* Member Table */}
              <div className="gap-y-4">
                <MemberTable
                  label="Team Members"
                  labelClassName="text-lg font-semibold"
                  tableClassName="max-h-[300px] overflow-y-auto"
                  teamMembers={teamMembers}
                  className="w-full"
                  handleMemberAdd={handleAddTeamMember}
                  handleMemberRemove={handleRemoveTeamMember}
                  handleEditMemberRole={handleEditMemberRole}
                  roleList={defaultRoleList}
                />
              </div>
            </div>

            <div className="flex w-full flex-col gap-y-4">
              {/* Context Text */}
              <InputTextAreaField
                id="project-context-field"
                label={
                  <span className="flex items-center gap-1">
                    Context
                    <AIDisclaimer />
                  </span>
                }
                html-rows="20"
                placeholder="Tell us about your project..."
                value={form.context}
                name="context"
                onChange={handleChange}
                labelClassName="text-lg font-semibold"
              />

              {/* Context Files */}
              <div>
                <FileList
                  label="Context Files"
                  files={files}
                  tokenLimit={env.NEXT_PUBLIC_FILE_TOKEN_LIMIT}
                  handleFileAdd={handleFilesAdd}
                  handleFileRemove={handleFilesDelete}
                />
              </div>

              {/* Context Links */}
              <div>
                <LinkList
                  label="Context Links"
                  links={links}
                  handleLinkAdd={handleLinkAdd}
                  handleLinkRemove={handleLinkDelete}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </PageContext.Provider>
  );
}
