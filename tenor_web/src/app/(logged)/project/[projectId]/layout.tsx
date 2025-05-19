"use client";

import { useParams, usePathname } from "next/navigation";
import React, { useMemo, type PropsWithChildren } from "react";
import InterceptedLink from "~/app/_components/InterceptableLink";
import Navbar from "~/app/_components/Navbar";
import Tabbar from "~/app/_components/Tabbar";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import { tabsMetaInformation, tabsToLinks } from "~/lib/tabs";
import SearchOffIcon from "@mui/icons-material/SearchOff";

export default function ProjectLayout({ children }: PropsWithChildren) {
  const { projectId } = useParams();
  const pathName = usePathname();
  const tab = pathName.split("/").pop();

  const { data: projectNameData } = api.projects.getProjectName.useQuery({
    projectId: projectId as string,
  });
  const { data: role, isLoading: isLoadingRole } =
    api.settings.getMyRole.useQuery({
      projectId: projectId as string,
    });

  const permitted = useMemo(() => {
    if (!role || !tab) {
      return false;
    }
    // Project OverView
    if (tab == projectId) {
      return true;
    }

    const metaTab = [
      "ai",
      "users",
      "tags-scrumboard",
      "scrum-preferences",
    ].includes(tab)
      ? tabsMetaInformation.settings
      : tabsMetaInformation[
          tabsToLinks[
            tab as keyof typeof tabsToLinks
          ] as keyof typeof tabsMetaInformation
        ];
    if (!metaTab) {
      return false;
    }

    // Check if the user has the required permissions for the tab
    const { flags } = metaTab;
    for (const flag of flags) {
      if (!role?.[flag as keyof typeof role]) {
        return false;
      }
    }

    return true;
  }, [role, tab]);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Navbar>
        <div className="flex gap-1">
          <InterceptedLink href="/" className="flex shrink-0 font-semibold">
            Projects
          </InterceptedLink>
          {role && (
            <span
              className={cn(
                "inline-block max-w-[40vw] truncate opacity-0 transition",
                {
                  "opacity-100": !!projectNameData,
                },
              )}
            >
              / {projectNameData ?? ""}
            </span>
          )}
        </div>
      </Navbar>
      <Tabbar />
      {/* Only show content after the role is loaded */}
      {!isLoadingRole && (
        <>
          {permitted ? (
            <main className="m-6 flex-1 overflow-hidden p-4">{children}</main>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <SearchOffIcon style={{ fontSize: 100, color: "gray" }} />
              <p className="mt-4 text-xl font-semibold text-gray-600">
                Oops... the page you are looking for is not here.
              </p>
              <p className="mt-2 text-sm text-gray-500">
                If you are looking for a project, ask the administrator to give
                you access.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
