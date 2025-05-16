"use client";

import ProgressStatusBar from "~/app/_components/ProjectStatus";
import { useParams } from "next/navigation";

export default function ProjectOverview() {

  const params = useParams();
  const projectId = params.projectId as string;

  return (
    <div className="-m-5 w-full">
      <ProgressStatusBar
        projectId={projectId}
      />
      {/* <img
        src="/overview_mockup.png"
        alt=""
        className="mx-auto w-[calc(100vw-200px)]"
      /> */}
    </div>
  );
}
