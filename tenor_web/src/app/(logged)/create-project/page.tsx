"use client";
import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import Navbar from "~/app/_components/Navbar";
import Link from "next/link";
import Tabbar from "~/app/_components/Tabbar";
import InputTextField from "~/app/_components/inputs/InputTextField";
import InputTextAreaField from "~/app/_components/inputs/InputTextAreaField";
import InputFileField from "~/app/_components/inputs/InputFileField";
import MemberTable, {
  type TeamMember,
} from "~/app/_components/inputs/MemberTable";
import LinkList from "~/app/_components/inputs/LinkList";
import FileList from "~/app/_components/inputs/FileList";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "~/trpc/react";
import { useAlert } from "~/app/_hooks/useAlert";
import { defaultRoleList } from "~/lib/defaultProjectValues";
import { type Links } from "~/server/api/routers/settings";

import { toBase64 } from "~/utils/base64";

export default function ProjectCreator() {
  const utils = api.useUtils();

  const router = useRouter();
  const { mutateAsync: createProject, isPending } =
    api.projects.createProject.useMutation();

  const { alert } = useAlert();
  const handleCreateProject = async () => {
    // Block project creation if there is a pending request
    if (isPending) {
      return;
    }

    if (!form.name) {
      alert("Oops...", "Project Name must have a value.", {
        type: "error",
        duration: 5000, // time in ms (5 seconds)
      });
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

    const finalLinks: { link: string; content: string | null }[] = [];
    for (const link of links) {
      finalLinks.push({ link: link.url, content: null });
    }

    const response = await createProject({
      name: form.name,
      description: form.description,
      logo: logoBase64Encoded ?? "",
      users: teamMembers.map((member) => ({
        userId: member.id,
        roleId: member.role,
      })),
      settings: {
        aiContext: {
          text: form.context,
          files: filesBase64Encoded,
          links: finalLinks,
        },
      },
    });

    if (response.success) {
      router.push(`/project/${response.projectId}`);
      await utils.projects.listProjects.invalidate();
    } else {
      alert(
        "Oops...",
        "There was an error creating the project. Try again later.",
        {
          type: "error",
          duration: 5000, // time in ms (5 seconds)
        },
      );
    }
  };

  const [form, setForm] = useState({
    name: "",
    description: "",
    context: "",
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const handleRemoveTeamMember = (id: (string | number)[]) => {
    setTeamMembers((prev) => prev.filter((member) => !id.includes(member.id)));
  };
  const handleAddTeamMember = (user: TeamMember) => {
    setTeamMembers((prev) => [...prev, user]);
  };
  const handleEditMemberRole = (id: string, role: string) => {
    setTeamMembers((prev) =>
      prev.map((member) => {
        if (member.id === id) {
          return {
            ...member,
            role: role,
          };
        }
        return member;
      }),
    );
  };

  const logoSizeLimit = 3 * 1024 * 1024; // 3MB in bytes
  const logoMaxDimensions = 1024; // Maximum width/height in pixels
  const [icon, setImage] = useState<File | null>(null);
  const [isValidatingImage, setIsValidatingImage] = useState(false);

  function handleImageChange(file: File) {
    if (isValidatingImage) return;
    setIsValidatingImage(true);

    // Check file size
    if (file.size > logoSizeLimit) {
      alert("File too large", "Logo image must be smaller than 3MB", {
        type: "error",
        duration: 5000,
      });
      setIsValidatingImage(false);
      return;
    }

    // Check image dimensions
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      if (img.width > logoMaxDimensions || img.height > logoMaxDimensions) {
        alert(
          "Image too large",
          `Logo dimensions must be 1024x1024 pixels or smaller. This image is ${img.width}x${img.height}.`,
          {
            type: "error",
            duration: 5000,
          },
        );
        setIsValidatingImage(false);
      } else {
        // If all validations pass, set the image
        setImage(file);
        setIsValidatingImage(false);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      alert("Invalid image", "Please upload a valid image file", {
        type: "error",
        duration: 5000,
      });
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
    setLinks((prev) => [...prev, link]);
  }
  function handleLinkDelete(link: Links) {
    setLinks((prev) => prev.filter((l) => l.url !== link.url));
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
      alert(
        "Limit exceeded",
        `The project name can't be longer than ${maxProjectNameLength} characters.`,
        {
          type: "warning",
          duration: 3000,
        },
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

  return (
    <div>
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
        <div className="header flex w-full justify-between pb-6">
          <h1 className="text-2xl font-semibold">Project Creator</h1>
          <PrimaryButton onClick={handleCreateProject} loading={isPending}>
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
                  label={`Project Name (${form.name.length}/${maxProjectNameLength})`}
                  value={form.name}
                  onChange={handleChange}
                  name="name"
                  placeholder="What is your project called..."
                  labelClassName="text-lg font-semibold"
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
              label="Description"
              html-rows="4"
              placeholder="What is this project about..."
              className="min-h-[140px] w-full"
              value={form.description}
              onChange={handleChange}
              name="description"
              labelClassName="text-lg font-semibold"
            />

            {/* Member Table */}
            <div className="gap-y-4">
              <MemberTable
                label="Team Members"
                labelClassName="text-lg font-semibold"
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
              className="min-h-[180px]"
              label="Context"
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
                memoryLimit={10_000_000} // 10MB
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
  );
}
