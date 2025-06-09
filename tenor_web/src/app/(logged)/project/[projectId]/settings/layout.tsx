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
import usePersistentState from "~/app/_hooks/usePersistentState";
import SidebarToggleIcon from "~/app/_components/SidebarToggleIcon";
import { useWindowRect } from "~/app/_hooks/windowHooks";

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

  const [showSidebar, setShowSidebar] = usePersistentState(
    true,
    "showSettingsSidebar",
  );

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

  const { isTablet } = useWindowRect();

  return (
    <div className="relative flex h-full flex-row">
      <div
        className={cn(
          "flex h-full w-[426px] basis-[426px] flex-col border-r-2 bg-white pt-10 xl:relative",
          {
            "w-auto basis-[80px]": !showSidebar,
            "absolute left-0 z-[100] h-full w-[426px] min-w-[426px]":
              showSidebar,
          },
        )}
      >
        <div
          className={cn("flex items-center gap-4 pb-4 pl-6", {
            relative: !showSidebar,
          })}
        >
          <SidebarToggleIcon
            flipped
            setSidebarShown={setShowSidebar}
            sidebarShown={showSidebar}
            label="settings"
          />
          {showSidebar && (
            <h1 className={cn("text-3xl font-semibold", {})}>
              Project Settings
            </h1>
          )}
          {!showSidebar && (
            <h1 className="absolute left-[9px] top-[40px] break-words font-medium text-gray-600">
              Settings
            </h1>
          )}
        </div>
        {showSidebar &&
          pages.map(({ title, link, icon: Icon }, i) => {
            if (title === "General") {
              if (role?.id !== "owner") {
                return null;
              }
            }

            return (
              <InterceptedLink
                key={link}
                className={cn(
                  "flex items-center gap-3 border-t-2 p-4 pl-10 hover:bg-gray-100",
                  i === pages.length - 1 && "border-b-2",
                  joinPath(rootPath, link) === pathName && "bg-gray-100",
                )}
                onClick={() => {
                  if (isTablet) {
                    setShowSidebar(false);
                  }
                }}
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
      {showSidebar && (
        <div
          className="absolute left-0 top-0 z-[99] h-full w-full bg-black/10 xl:hidden"
          onClick={() => setShowSidebar(false)}
          data-cy="dismiss-sidebar"
        />
      )}
      <div
        className={cn("ml-10 flex-1 overflow-auto py-10 pr-10", {
          "pl-[80px] xl:pl-0": showSidebar,
        })}
      >
        {children}
      </div>
    </div>
  );
}
