"use client";

import { useParams, usePathname } from "next/navigation";
import React, { type MouseEventHandler } from "react";
import { useEffect } from "react";
import { cn } from "~/lib/helpers/utils";
import InterceptedLink from "./InterceptableLink";
import { api } from "~/trpc/react";
import { tabs, tabsMetaInformation } from "~/lib/tabs";
import { useFirebaseAuth } from "~/app/_hooks/useFirebaseAuth";

interface Props {
  disabled?: boolean;
  mainPageName?: string;
}
export default function Tabbar({ disabled, mainPageName }: Props) {
  const pathname = usePathname();
  const { user } = useFirebaseAuth();
  const { projectId } = useParams();
  const projectPath = `/project/${projectId as string}`;
  let cutPathname = pathname.slice(projectPath.length) || "/";

  if (cutPathname.split("/").length > 2) {
    cutPathname = `/${cutPathname.split("/")[1]!}`;
  }

  const handleClick: MouseEventHandler = (e) => {
    const element = e.target as HTMLAnchorElement;
    element.scrollIntoView({
      behavior: "smooth",
    });
  };

  const ensureTeamProgress =
    api.sprintRetrospectives.ensureRetrospectiveTeamProgress.useMutation();
  const ensurePersonalProgress =
    api.sprintRetrospectives.ensureRetrospectivePersonalProgress.useMutation();

  const { data: role } = api.settings.getMyRole.useQuery({
    projectId: (projectId as string) ?? "",
  });

  const { data: previousSprint, isLoading: isLoadingPreviousSprint } =
    api.sprintRetrospectives.getPreviousSprint.useQuery(
      {
        projectId: projectId as string,
      },
      {
        enabled: !!projectId,
      },
    );

  useEffect(() => {
    if (previousSprint && projectId) {
      ensureTeamProgress.mutate({
        projectId: projectId as string,
        sprintId: previousSprint.id,
      });
      ensurePersonalProgress.mutate({
        projectId: projectId as string,
        sprintId: previousSprint.id,
        userId: user?.uid ?? "",
      });
    }
  }, [projectId, previousSprint]);

  return (
    <div className="no-scrollbar flex h-8 w-screen items-center gap-2 overflow-x-auto whitespace-nowrap bg-app-primary px-8">
      {tabs.map((id) => {
        const meta =
          tabsMetaInformation[id as keyof typeof tabsMetaInformation];
        if (!meta) return null;

        const { title, link, enabled, flags } = meta;

        if (id === "retrospective") {
          if (isLoadingPreviousSprint || !previousSprint) {
            return null;
          }
        }

        for (const flag of flags) {
          if (!role?.[flag as keyof typeof role]) {
            return null;
          }
        }

        const href = projectPath + link;
        const isActive = link === cutPathname;

        return (
          <InterceptedLink
            key={id}
            className={cn(
              "group relative flex h-full items-center rounded-t-lg px-3 font-medium text-white outline-none",
              {
                "bg-white text-app-primary ring-app-secondary": isActive,
                "pointer-events-none opacity-50":
                  !enabled || (disabled && !isActive),
              },
            )}
            href={href}
            onClick={handleClick}
          >
            <span data-cy={id}>
              {id === "overview" && mainPageName ? mainPageName : title}
            </span>

            {isActive && (
              <>
                <div className="absolute -left-3 bottom-0 h-3 w-3 rounded-full bg-app-primary shadow-[5px_5px_0_0_white]"></div>
                <div className="absolute -right-3 bottom-0 h-3 w-3 rounded-full bg-app-primary shadow-[-5px_5px_0_0_white]"></div>
              </>
            )}
            <div className="absolute left-1 top-1 h-[calc(100%-0.5rem)] w-[calc(100%-0.5rem)] rounded ring-0 ring-blue-500 group-focus-visible:ring-2"></div>
          </InterceptedLink>
        );
      })}
    </div>
  );
}
