"use client";
import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import { FilterSearch } from "~/app/_components/FilterSearch";
import Navbar from "~/app/_components/Navbar";
import Link from "next/link";
import Tabbar from "~/app/_components/Tabbar";
import InputTextField from "~/app/_components/inputs/InputTextField";
import InputTextAreaField from "~/app/_components/inputs/InputTextAreaField";
import InputFileField from "~/app/_components/inputs/InputFileField";
import Table, { TableColumns } from "~/app/_components/table/Table";
import MemberTable, {
  type TeamMember,
} from "~/app/_components/inputs/MemberTable";
import LinkList from "~/app/_components/inputs/LinkList";
import FileList from "~/app/_components/inputs/FileList";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { useAlert } from "~/app/_hooks/useAlert";
import { UserRecord } from "node_modules/firebase-admin/lib/auth/user-record";

export default function ProjectCreator() {
  const toBase64 = (file: File) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });

  const router = useRouter();
  const { mutateAsync: createProject } =
    api.projects.createProject.useMutation();

  const { alert, predefinedAlerts } = useAlert();
  const handleCreateProject = async () => {
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

    const filesBase64Encoded: string[] = [];
    for (const file of files) {
      const fileBase64 = (await toBase64(file)) as string;
      filesBase64Encoded.push(fileBase64);
    }

    const response = await createProject({
      name: form.name,
      description: form.description,
      logo: logoBase64Encoded,
      users: teamMembers.map((member) => ({
        userId: member.id,
        roleId: member.role,
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

  // Icon File
  const [icon, setImage] = useState<File | null>(null);
  function handleImageChange(file: File) {
    setImage(file);
  }

  // Context Files
  const [files, setFiles] = useState<File[]>([]);
  function handleFilesAdd(files: File[]) {
    setFiles((prev) => [...prev, ...files]);
  }
  function handleFilesDelete(file: File) {
    setFiles((prev) => prev.filter((f) => f !== file));
  }

  const [links, setLinks] = useState<string[]>([]);
  function handleLinkAdd(link: string) {
    setLinks((prev) => [...prev, link]);
  }
  function handleLinkDelete(link: string) {
    setLinks((prev) => prev.filter((l) => l !== link));
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div>
      <Navbar>
        <div className="flex gap-1">
          <Link href="/" className="font-semibold">
            Projects
          </Link>
          <span>/ ProjectName</span>
        </div>
      </Navbar>
      <Tabbar disabled mainPageName="Project Creator" />
      <main className="m-6 p-4">
        <div className="header flex w-full justify-between pb-6">
          <h1 className="text-2xl font-semibold">Project Creator</h1>
          <PrimaryButton onClick={handleCreateProject}>
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
                  label="Project Name"
                  className="h-12"
                  value={form.name}
                  onChange={handleChange}
                  name="name"
                  placeholder="What is your project called?"
                />
              </div>

              {/* Project Icon */}
              <div className="flex-1">
                <InputFileField
                  label="Icon"
                  accept="image/*"
                  className="h-12"
                  image={icon}
                  handleImageChange={handleImageChange}
                />
              </div>
            </div>

            {/* Project Description */}
            <InputTextAreaField
              label="Description"
              html-rows="4"
              placeholder="What is this project about?"
              className="min-h-[140px] w-full"
              value={form.description}
              onChange={handleChange}
              name="description"
            />

            {/* Member Table */}
            <div className="gap-y-4">
              <MemberTable
                label="Team Members"
                teamMembers={teamMembers}
                className="w-full"
                handleMemberAdd={handleAddTeamMember}
                handleMemberRemove={handleRemoveTeamMember}
                handleEditMemberRole={handleEditMemberRole}
                roleList={[
                  { id: "admin_role_id", label: "Admin" },
                  { id: "developer_role_id", label: "Developer" },
                  { id: "viewer_role_id", label: "Viewer" },
                ]}
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
            />

            {/* Contexr Files */}
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
