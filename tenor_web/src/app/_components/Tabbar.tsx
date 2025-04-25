"use client";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import React, { type MouseEventHandler } from "react";
import { cn } from "~/lib/utils";

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

  // TODO: in the future we're going to have more functionality here like being able to disable certain tabs based on role, showing tabs conditionally like sprint review, etc...
  const tabs = [
    { title: mainPageName ?? "Overview", link: "/", enabled: true },
    { title: "Requirements", link: "/requirements", enabled: true },
    { title: "User Stories", link: "/user-stories", enabled: true },
    { title: "Issues", link: "/issues", enabled: false },
    { title: "Sprints", link: "/sprints", enabled: true },
    { title: "Scrum Board", link: "/scrumboard", enabled: true },
    { title: "Calendar", link: "/calendar", enabled: false },
    { title: "Performance", link: "/performance", enabled: false },
    { title: "Project Settings", link: "/project-settings", enabled: true },
  ];

  const handleClick: MouseEventHandler = (e) => {
    const element = e.target as HTMLAnchorElement;
    element.scrollIntoView({
      behavior: "smooth",
    });
  };

  return (
    <div className="no-scrollbar flex h-8 w-screen items-center gap-2 overflow-x-scroll whitespace-nowrap bg-app-primary px-8">
      {tabs.map(({ title, link, enabled }, i) => (
        <Link
          key={i}
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
          {title}
          {link === cutPathname && (
            <>
              <div className="absolute -left-3 bottom-0 h-3 w-3 rounded-full bg-app-primary shadow-[5px_5px_0_0_white]"></div>
              <div className="absolute -right-3 bottom-0 h-3 w-3 rounded-full bg-app-primary shadow-[-5px_5px_0_0_white]"></div>
            </>
          )}
        </Link>
      ))}
    </div>
  );
}
