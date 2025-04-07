"use client";

import Link from "next/link";
import React, { type PropsWithChildren } from "react";
import Navbar from "~/app/_components/Navbar";
import Tabbar from "~/app/_components/Tabbar";
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

  console.log("pathname", pathname);

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

// export default function Tabbar({ disabled, mainPageName } : Props ) {
//   const pathname = usePathname();
//   const params = useParams();
//   const projectPath = `/project/${params.projectId as string}`;
//   const cutPathname = pathname.slice(projectPath.length) || "/";

//   // TODO: in the future we're going to have more functionality here like being able to disable certain tabs based on role, showing tabs conditionally like sprint review, etc...
//   const tabs = [
//     { title: mainPageName ?? "Overview", link: "/" },
//     { title: "Requirements", link: "/requirements" },
//     { title: "User Stories", link: "/user-stories" },
//     { title: "Issues", link: "/issues" },
//     { title: "Sprints", link: "/sprints" },
//     { title: "Kanban", link: "/kanban" },
//     { title: "Calendar", link: "/calendar" },
//     { title: "Performance", link: "/performance" },
//     { title: "Project Settings", link: "/project-settings" },
//   ];

//   const handleClick: MouseEventHandler = (e) => {
//     const element = e.target as HTMLAnchorElement;
//     element.scrollIntoView({
//       behavior: "smooth",
//     });
//   };

//   return (
//     <div className="no-scrollbar flex h-8 w-screen items-center gap-2 overflow-x-scroll whitespace-nowrap bg-app-primary px-8">
//       {tabs.map(({ title, link }, i) => (
//         <Link
//           key={i}
//           className={cn(
//             "relative flex h-full items-center rounded-t-lg px-3 font-medium text-white",
//             {
//               "bg-white text-app-primary": link === cutPathname,
//               "text-gray-300  pointer-events-none": disabled && link !== cutPathname,
//             },
//           )}
//           href={projectPath + link}
//           onClick={handleClick}
//         >
//           {title}
//           {link === cutPathname && (
//             <>
//               <div className="absolute -left-3 bottom-0 h-3 w-3 rounded-full bg-app-primary shadow-[5px_5px_0_0_white]"></div>
//               <div className="absolute -right-3 bottom-0 h-3 w-3 rounded-full bg-app-primary shadow-[-5px_5px_0_0_white]"></div>
//             </>
//           )}
//         </Link>
//       ))}
//     </div>
//   );
// }
