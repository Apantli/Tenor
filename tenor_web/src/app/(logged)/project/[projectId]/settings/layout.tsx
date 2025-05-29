"use client";

import { useRef, type PropsWithChildren } from "react";
import SettingsIcon from "@mui/icons-material/Settings";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import LabelOutlinedIcon from "@mui/icons-material/LabelOutlined";
import RouteIcon from "@mui/icons-material/Route";
import { cn } from "~/lib/helpers/utils";
import { useParams, usePathname, useRouter } from "next/navigation";
import path from "path";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import useConfirmation from "~/app/_hooks/useConfirmation";
import { api } from "~/trpc/react";
import InterceptedLink from "~/app/_components/InterceptableLink";
const joinPath = (...paths: string[]) => {
  const joined = path.join(...paths);
  return joined.endsWith("/") ? joined.slice(0, -1) : joined;
};

export default function SettingsLayout({ children }: PropsWithChildren) {
  const { projectId } = useParams();
  const pathName = usePathname();
  const router = useRouter();

  const isModified = useRef(false);
  const confirm = useConfirmation();

  const { data: role } = api.settings.getMyRole.useQuery({
    projectId: projectId as string,
  });

  const pages = [
    { title: "General", link: "/", icon: SettingsIcon },
    {
      title: "Users & Permissions",
      link: "/users",
      icon: PeopleAltIcon,
    },
    { title: "AI context", link: "/ai", icon: AutoAwesomeIcon },
    { title: "Scrum Preferences", link: "/scrum-preferences", icon: RouteIcon },
    {
      title: "Tags & Scrumboard",
      link: "/tags-scrumboard",
      icon: LabelOutlinedIcon,
    },
  ];

  const layout_dir = "settings";

  const dirIndex = pathName.indexOf(layout_dir) + layout_dir.length;
  const rootPath = pathName.slice(0, dirIndex);

  return (
    <div className="flex h-full flex-row">
      <div className="flex h-full w-[450px] basis-[400px] flex-col border-r-2 pr-10">
        <h1 className="mb-5 text-3xl font-semibold">Project Settings</h1>

        {pages.map(({ title, link, icon: Icon }, i) => {
          if (title === "General") {
            if (role?.id !== "owner") {
              return null;
            }
          }

          return (
            <InterceptedLink
              key={link}
              className={cn(
                "flex items-center gap-3 border-t-2 p-4 hover:bg-gray-100",
                i === pages.length - 1 && "border-b-2",
                joinPath(rootPath, link) === pathName && "bg-gray-100",
              )}
              href={joinPath(rootPath, link)}
            >
              <Icon fontSize="large" />
              <span
                className={cn({
                  "font-semibold": joinPath(rootPath, link) === pathName,
                })}
                onClick={async () => {
                  if (joinPath(rootPath, link) === pathName) return;
                  if (isModified.current) {
                    const confirmation = await confirm(
                      "Are you sure?",
                      "Your changes will be discarded.",
                      "Discard changes",
                      "Keep Editing",
                    );
                    if (!confirmation) return;
                  }
                  isModified.current = false;
                  router.push(joinPath(rootPath, link));
                }}
              >
                {title}
              </span>
              {joinPath(rootPath, link) !== pathName && (
                <ArrowForwardIosIcon className="ml-auto text-gray-300" />
              )}
            </InterceptedLink>
          );
        })}
      </div>
      <div className="ml-10 flex-1 overflow-auto">{children}</div>
    </div>
  );
}
