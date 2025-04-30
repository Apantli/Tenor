"use client";

import { useParams } from "next/navigation";
import React from "react";
import { api } from "~/trpc/react";
import PillComponent from "../PillComponent";
import type { Tag } from "~/lib/types/firebaseSchemas";
import { cn } from "~/lib/utils";

interface Props {
  status?: Tag;
  onChange: (status: Tag) => void;
  className?: string;
}

export default function StatusPicker({ status, onChange, className }: Props) {
  const { projectId } = useParams();
  const { data: statusValues } = api.settings.getStatusTypes.useQuery({
    projectId: projectId as string,
  });

  const automaticTag = {
    id: "",
    name: "Automatic",
    color: "#000000",
    deleted: false,
  };
  const statusValuesWithAuto = [automaticTag, ...(statusValues ?? [])];

  return (
    <PillComponent
      currentTag={status ?? automaticTag}
      allTags={statusValuesWithAuto ?? []}
      callBack={onChange}
      labelClassName={cn("w-full", className)}
    />
  );
}
