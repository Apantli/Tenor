"use client";

import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import { useAlert } from "~/app/_hooks/useAlert";
import { permissionLabels } from "~/lib/types/firebaseSchemas";

export default function ProjectOverview() {
  const { projectId } = useParams();
  const { data: role } = api.settings.getMyRole.useQuery({
    projectId: projectId as string,
  });

  return (
    <div className="-m-5 w-full">
      <img
        src="/overview_mockup.png"
        alt=""
        className="mx-auto w-[calc(100vw-200px)]"
      />
    </div>
  );
}
