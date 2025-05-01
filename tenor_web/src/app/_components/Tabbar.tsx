"use client";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import React, { type MouseEventHandler } from "react";
import { cn } from "~/lib/utils";
import InterceptedLink from "./InterceptableLink";
import { api } from "~/trpc/react";
import { permissionMapping } from "~/lib/types/firebaseSchemas";
import { tabs, tabsMetaInformation } from "~/lib/tabs";

interface Props {
  disabled?: boolean;
  mainPageName?: string;
}
export default function Tabbar({ disabled, mainPageName }: Props) {
  const pathname = usePathname();
  const params = useParams();
  const projectPath = `/project/${params.projectId as string}`;
  let cutPathname = pathname.slice(projectPath.length) || "/";

  // Consider the immediate parent directory, ignoring nested directories
  if (cutPathname.split("/").length > 1) {
    cutPathname = "/" + cutPathname.split("/")[1]!;
  }

  const handleClick: MouseEventHandler = (e) => {
    const element = e.target as HTMLAnchorElement;
    element.scrollIntoView({
      behavior: "smooth",
    });
  };

  const { data: role } = api.settings.getMyRole.useQuery({
    projectId: (params.projectId as string) ?? "",
  });

  return (
    <div className="no-scrollbar flex h-8 w-screen items-center gap-2 overflow-x-auto whitespace-nowrap bg-app-primary px-8">
      {tabs.map((id) => {
        const { title, link, enabled, flags } =
          tabsMetaInformation[id as keyof typeof tabsMetaInformation];

        for (const flag of flags) {
          if (!role?.[flag as keyof typeof role]) {
            return null;
          }
        }

        return (
          <InterceptedLink
            key={id}
            className={cn(
              "relative flex h-full items-center rounded-t-lg px-3 font-medium text-white",
              {
                "bg-white text-app-primary": link === cutPathname,
                "pointer-events-none opacity-50":
                  !enabled || (disabled && link !== cutPathname),
              },
            )}
            href={projectPath + link}
            onClick={handleClick}
          >
            {id === "overview" && mainPageName ? mainPageName : title}
            {link === cutPathname && (
              <>
                <div className="absolute -left-3 bottom-0 h-3 w-3 rounded-full bg-app-primary shadow-[5px_5px_0_0_white]"></div>
                <div className="absolute -right-3 bottom-0 h-3 w-3 rounded-full bg-app-primary shadow-[-5px_5px_0_0_white]"></div>
              </>
            )}
          </InterceptedLink>
        );
      })}
    </div>
  );
}
