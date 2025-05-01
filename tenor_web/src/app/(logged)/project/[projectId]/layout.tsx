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
  const { data: role, isLoading: isLoadingRole } =
    api.settings.getMyRole.useQuery({
      projectId: projectId as string,
    });

  const permitted = useMemo(() => {
    // Project OverView
    if (tab == projectId) {
      return true;
    }

    // CHECK TABS BY FLAGS
    return true;
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
      {/* Only show content after the role is loaded */}
      {!isLoadingRole && (
        <>
          {permitted ? (
            <main className="m-6 flex-1 overflow-hidden p-4">{children}</main>
          ) : (
            // FIMXE: Make this pretty
            // FIXME: I think in this case we should redirect instead of showing a 404
            <h1 className="m-6 text-3xl font-semibold">Page not found</h1>
          )}
        </>
      )}
    </div>
  );
}
