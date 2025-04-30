"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import React, { useMemo, type PropsWithChildren } from "react";
import InterceptedLink from "~/app/_components/InterceptableLink";
import Navbar from "~/app/_components/Navbar";
import Tabbar from "~/app/_components/Tabbar";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

import { permissionMapping } from "~/lib/types/firebaseSchemas";

export default function ProjectLayout({ children }: PropsWithChildren) {
  const { projectId } = useParams();
  const pathName = usePathname();
  const tab = pathName.split("/").pop();

  const { data: projectNameData } = api.projects.getProjectName.useQuery({
    projectId: projectId as string,
  });
  const { data: role } = api.settings.getMyRole.useQuery({
    projectId: projectId as string,
  });

  const permitted = useMemo(() => {
    // Project OverView
    if (tab == projectId) {
      return true;
    }

    if (role && tab) {
      const permissionKey =
        permissionMapping[tab as keyof typeof permissionMapping];

      // Check if the tab is in the project-settings mapping
      if (!permissionKey) {
        const projectSettingsTabs = [
          "users",
          "ai",
          "scrum-preferences",
          "tags-kanban",
        ];

        if (
          projectSettingsTabs.includes(tab) &&
          role.tabs["projectSettings" as keyof typeof role.tabs] > 0
        ) {
          return true;
        }
      }
      const permission = role.tabs[permissionKey as keyof typeof role.tabs];
      return permission && permission > 0;
    }
    return false;
  }, [role, tab]);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Navbar>
        <div className="flex gap-1">
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
      {permitted ? (
        <main className="m-6 flex-1 overflow-hidden p-4">{children}</main>
      ) : (
        // FIMXE: Make this pretty
        <h1 className="m-6 text-3xl font-semibold">Page not found</h1>
      )}
    </div>
  );
}
