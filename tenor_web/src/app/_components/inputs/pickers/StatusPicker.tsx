"use client";

import { useParams } from "next/navigation";
import React from "react";
import { api } from "~/trpc/react";
import PillComponent from "./PillComponent";
import type { StatusTag, Tag } from "~/lib/types/firebaseSchemas";
import { cn } from "~/lib/utils";

interface Props {
  status?: Tag;
  onChange: (status: StatusTag) => void;
  className?: string;
  showAutomaticStatus?: boolean;
  disabled?: boolean;
}

export default function StatusPicker({
  status,
  onChange,
  className,
  showAutomaticStatus = false,
  disabled,
}: Props) {
  const { projectId } = useParams();
  const { data: statusValues } = api.settings.getStatusTypes.useQuery({
    projectId: projectId as string,
  });

  const automaticTag = {
    id: "",
    name: "Automatic",
    color: "#333333",
    deleted: false,
    orderIndex: -1,
    marksTaskAsDone: false,
  };

  let statusValuesWithAuto: StatusTag[] = [];
  if (showAutomaticStatus) {
    statusValuesWithAuto = [automaticTag, ...(statusValues ?? [])];
  } else {
    statusValuesWithAuto = statusValues ?? [];
  }

  let currentStatus = status;
  if (currentStatus === undefined && showAutomaticStatus) {
    currentStatus = automaticTag;
  }

  return (
    <PillComponent
      disabled={disabled}
      currentTag={currentStatus}
      allTags={statusValuesWithAuto ?? []}
      callBack={(tag) =>
        onChange(statusValuesWithAuto.find((t) => t.id === tag.id)!)
      }
      labelClassName={cn("w-full", className)}
    />
  );
}
