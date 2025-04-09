"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import React, { type PropsWithChildren } from "react";
import Navbar from "~/app/_components/Navbar";
import Tabbar from "~/app/_components/Tabbar";
import { api } from "~/trpc/react";

export default function ProjectLayout({ children }: PropsWithChildren) {
  const { projectId } = useParams();

  const { data: projectNameData, isLoading } =
    api.projects.getProjectName.useQuery({ projectId: projectId as string });

  if (isLoading || !projectNameData) {
    return <></>;
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Navbar>
        <div className="flex gap-1">
          <Link href="/" className="font-semibold">
            Projects
          </Link>
          <span>/ {projectNameData.projectName}</span>
        </div>
      </Navbar>
      <Tabbar />
      <main className="m-6 flex-1 overflow-hidden p-4">{children}</main>
    </div>
  );
}
