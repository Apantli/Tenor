"use client";
import PrimaryButton from "~/app/_components/PrimaryButton";
import { FilterSearch } from "~/app/_components/FilterSearch";
import Navbar from "~/app/_components/Navbar";
import Link from "next/link";
import Tabbar from "~/app/_components/Tabbar";
import InputTextField from "~/app/_components/inputs/InputTextField";
import InputTextAreaField from "~/app/_components/inputs/InputTextAreaField";
import InputFileField from "~/app/_components/inputs/InputFileField";
import { useState } from "react";
import Table, { TableColumns } from "~/app/_components/table/Table";
import MemberTable, { type TeamMember } from "~/app/_components/inputs/MemberTable";
import LinkList from "~/app/_components/inputs/LinkList";
import FileList from "~/app/_components/inputs/FileList";



export default function ProjectCreator() {
    const [ form, setForm ] = useState({
      name: "",
      description: "",
      context: "",
    });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { id: 1, picture_url: "https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg", name: "Alonso Huerta", email: "email@addres.com", role: "Admin" },
    { id: 2, picture_url: "https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg", name: "Sergio Gonzalez", email: "email@addres.com", role: "Scrum Master" },
    { id: 3, picture_url: "https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg", name: "Luis Amado", email: "email@addres.com", role: "Developer" },
  ]);
  const handleRemoveTeamMember = (id: (string | number)[]) => {
    setTeamMembers((prev) => prev.filter((member) => !id.includes(member.id)));
  }
  // FIXME: Fetch user and load information
  const handleAddTeamMember = (email: string) => {
    const id: number = teamMembers.length > 0 ? Math.max(...teamMembers.map((member) => member.id)) + 1 : 1;
    const newMember = {
      id: id,
      picture_url: "https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg",
      name: email,
      email: email,
      role: "Developer",
    };
    setTeamMembers((prev) => [...prev, newMember]);
  }

  // Icon File
  const [icon, setImage] = useState<File | null>(null);
  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    console.log("Image changed");
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
    }
  }

  // Context Files
  const [files, setFiles] = useState<File[]>([]);
  function handleFilesAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files) {
      const filesArray = Array.from(files);
      setFiles((prev) => [...prev, ...filesArray]);
    }
  }
  function handleFilesDelete(file: File) {
    setFiles((prev) => prev.filter((f) => f !== file));
  }

  const [links, setLinks] = useState<string[]>(["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "https://www.tiktok.com/@ramizeinn/video/7474372494661635358"]);
  // (string => void)receives a string and adds it to the list of links
  function handleLinkAdd(link: string) {
    setLinks((prev) => [...prev, link]);
  }
  function handleLinkDelete(link: string) {
    setLinks((prev) => prev.filter((l) => l !== link));
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div>
      <Navbar>
        <div className="flex gap-3">
          <Link href="/" className="font-semibold">
            Projects
          </Link>
          <span>/ ProjectName</span>
        </div>
      </Navbar>
      <Tabbar disabled mainPageName="Project Creator" />
      <main className="m-6 p-4">
      <div className="header w-full pb-6 flex justify-between">
        <h1 className="text-2xl font-semibold">Project Creator</h1>
        {/* FIXME: create project and redirect to page if successful, display error if not */}
        <PrimaryButton onClick={() => { console.log("Creating project") }}>Generate Project</PrimaryButton>
      </div>
      <hr />
      <div className="content pt-6 flex gap-4 w-full">

        <div className="flex flex-col gap-y-4 min-w-[45%]">

          <div className="flex flex-wrap gap-4">
            {/* Project Name */}
            <div className="flex-1 min-w-[300px]">
              <InputTextField label="Project Name" value={form.name} onChange={handleChange} name="name"/>
            </div>

            {/* Project Icon */}
            <div className="flex-1">
              <InputFileField label="Icon" accept="image/*" image={icon} handleImageChange={handleImageChange} />
            </div>
          </div>

          {/* Project Description */}
          <InputTextAreaField label="Description" html-rows="4" placeholder="What is this project about?" className="w-full min-h-[140px]" value={form.description} onChange={handleChange} name="description"/>

          {/* Member Table */}
          <div className="gap-y-4">
            <MemberTable label="Team Members" teamMembers={teamMembers} className="w-full" handleMemberAdd={handleAddTeamMember} handleMemberRemove={handleRemoveTeamMember}/>
          </div>
        </div>

        <div className="flex flex-col gap-y-4 w-full">
          {/* Context Text */}
          <InputTextAreaField className="min-h-[180px]" label="Context" html-rows="20" placeholder="Tell us about your project..."/>

          {/* Contexr Files */}
          <div>
            < FileList label="Context Files" files={files} handleFilesChange={handleFilesAdd} handleFileRemove={handleFilesDelete}/>
          </div>

          {/* Context Links */}
          <div>
                <LinkList label="Context Links" links={links} handleLinkAdd={handleLinkAdd} handleLinkRemove={handleLinkDelete}/>
          </div>

        </div>
      </div>
      </main>
    </div>
  )
}