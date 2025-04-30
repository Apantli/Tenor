"use client";

import { useParams } from "next/navigation";
import React from "react";
import { api } from "~/trpc/react";
import PillComponent from "../PillComponent";
import type { Tag } from "~/lib/types/firebaseSchemas";
import { cn } from "~/lib/utils";

interface Props {
  status?: Tag;
  onChange: (priority: Tag) => void;
  className?: string;
}

export default function StatusPicker({ status, onChange, className }: Props) {
  const { projectId } = useParams();
  const { data: statusValues } = api.settings.getStatusTypes.useQuery({
    projectId: projectId as string,
  });

  return (
    <PillComponent
      currentTag={status?.id !== "" ? status : undefined}
      allTags={statusValues ?? []}
      callBack={onChange}
      labelClassName={cn("w-full", className)}
    />
  );
}
