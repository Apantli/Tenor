"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import React, { type PropsWithChildren } from "react";
import InterceptedLink from "~/app/_components/InterceptableLink";
import Navbar from "~/app/_components/Navbar";
import Tabbar from "~/app/_components/Tabbar";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

export default function ProjectLayout({ children }: PropsWithChildren) {
  const { projectId } = useParams();

  const { data: projectNameData } = api.projects.getProjectName.useQuery({
    projectId: projectId as string,
  });

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Navbar>
        <div className="flex w-full grow gap-1">
          <InterceptedLink href="/" className="flex shrink-0 font-semibold">
            Projects
          </InterceptedLink>
          <span
            className={cn(
              "inline-block max-w-[40vw] truncate opacity-0 transition",
              {
                "opacity-100": !!projectNameData,
              },
            )}
          >
            / {projectNameData?.projectName ?? ""}
          </span>
        </div>
      </Navbar>
      <Tabbar />
      <main className="m-6 flex-1 overflow-hidden p-4">{children}</main>
    </div>
  );
}
