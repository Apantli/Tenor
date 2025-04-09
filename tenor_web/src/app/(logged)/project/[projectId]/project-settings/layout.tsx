"use client";

import Link from "next/link";
import { type PropsWithChildren, useState } from "react";
import SettingsIcon from "@mui/icons-material/Settings";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import LabelOutlinedIcon from "@mui/icons-material/LabelOutlined";
import RouteIcon from "@mui/icons-material/Route";
import { cn } from "~/lib/utils";
import { usePathname } from "next/navigation";
import path from "path";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

const join_path = (...paths: string[]) => {
  const joined = path.join(...paths);
  return joined.endsWith("/") ? joined.slice(0, -1) : joined;
};

export default function ProjectSettingsLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();

  const [isModified, setIsModified] = useState(false);

  const pages = [
    { title: "General", link: "/", icon: SettingsIcon },
    {
      title: "Users & Permissions",
      link: "/users",
      icon: PeopleAltIcon,
    },
    { title: "AI context", link: "/ai", icon: AutoAwesomeIcon },
    { title: "Scrum Preferences", link: "/scrum-preferences", icon: RouteIcon },
    { title: "Tags & Kanban", link: "/tags-kanban", icon: LabelOutlinedIcon },
  ];

  const layout_dir = "project-settings";

  const dirIndex = pathname.indexOf(layout_dir) + layout_dir.length;
  const rootPath = pathname.slice(0, dirIndex);

  return (
    <div className="flex h-[78vh] flex-row">
      <div className="flex h-full w-[450px] flex-col border-r-2 pr-3">
        <h1 className="mb-5 text-3xl font-bold">Project Settings</h1>
        {pages.map(({ title, link, icon: Icon }, i) => (
          <Link
            key={link}
            className={cn(
              "flex items-center gap-3 border-t-2 p-4 hover:bg-gray-100",
              i === pages.length - 1 && "border-b-2",
              join_path(rootPath, link) === pathname && "bg-gray-100",
            )}
            href={join_path(rootPath, link)}
          >
            <Icon fontSize="large" />
            <span
              className={cn(
                "text-lg",
                join_path(rootPath, link) === pathname && "font-semibold",
              )}
            >
              {title}
            </span>
            {join_path(rootPath, link) !== pathname && (
              <ArrowForwardIosIcon className="ml-auto text-gray-300" />
            )}
          </Link>
        ))}
      </div>
      <div className="m-6 p-4">{children}</div>
    </div>
  );
}
