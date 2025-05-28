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
  disabled,
}: Props) {
  const { projectId } = useParams();
  const { data: statusValues } = api.settings.getStatusTypes.useQuery({
    projectId: projectId as string,
  });

  return (
    <PillComponent
      disabled={disabled ?? false}
      currentTag={status}
      allTags={statusValues ?? []}
      callBack={(tag) =>
        onChange((statusValues ?? []).find((t) => t.id === tag.id)!)
      }
      labelClassName={cn("w-full", className)}
    />
  );
}
