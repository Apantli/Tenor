"use client";

import { useParams, usePathname } from "next/navigation";
import React, { useMemo, type PropsWithChildren } from "react";
import InterceptedLink from "~/app/_components/InterceptableLink";
import Navbar from "~/app/_components/Navbar";
import Tabbar from "~/app/_components/Tabbar";
import { cn } from "~/lib/helpers/utils";
import { api } from "~/trpc/react";
import { tabsMetaInformation, tabsToLinks } from "~/lib/tabs";
import LockPersonIcon from "@mui/icons-material/LockPerson";
import PrimaryButton from "~/app/_components/inputs/buttons/PrimaryButton";
import SearchOffIcon from "@mui/icons-material/SearchOff";

export default function ProjectLayout({ children }: PropsWithChildren) {
  const { projectId } = useParams();
  const pathName = usePathname();
  const tab = pathName.split("/").pop();

  const {
    data: projectNameData,
    error,
    isLoading: isLoadingProject,
  } = api.projects.getProjectName.useQuery({
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

  // Only show the tabbar if the user has at least one permission
  const checkShowTabbar = () => {
    for (const tab of Object.values(tabsMetaInformation)) {
      for (const flag of tab.flags) {
        if (role?.[flag as keyof typeof role]) {
          return true;
        }
      }
    }
    return false;
  };

  const showTabbar = checkShowTabbar();

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
      {!isLoadingRole && showTabbar && <Tabbar />}
      {/* Only show content after the role is loaded */}
      {!isLoadingRole && !error && (
        <>
          {permitted ? (
            <main className="flex flex-1 flex-col overflow-hidden">
              {children}
            </main>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <LockPersonIcon style={{ fontSize: 120, color: "gray" }} />
              <p className="mt-4 text-2xl font-semibold text-gray-600">
                Sorry... you&apos;re not allowed to access this page.
              </p>
              <p className="mt-2 text-xl text-gray-500">
                If you believe this is a mistake, ask the project administrator
                to give you access.
              </p>
              <PrimaryButton className="mt-8" href="/">
                Back to dashboard
              </PrimaryButton>
            </div>
          )}
        </>
      )}
      {!isLoadingProject && error && (
        <>
          <div className="flex h-full flex-col items-center justify-center text-center">
            <SearchOffIcon style={{ fontSize: 120, color: "gray" }} />
            <p className="mt-4 text-2xl font-semibold text-gray-600">
              Project not found
            </p>
            <p className="mt-2 text-xl text-gray-500">
              The project you are trying to access doesn&apos;t exist.
            </p>
            <PrimaryButton className="mt-8" href="/">
              Back to dashboard
            </PrimaryButton>
          </div>
        </>
      )}
    </div>
  );
}
