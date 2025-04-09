"use client";

import { useParams } from "next/navigation";
import React from "react";
import { api } from "~/trpc/react";
import PillComponent from "../PillComponent";
import type { Tag } from "~/lib/types/firebaseSchemas";
import { cn } from "~/lib/utils";

interface Props {
  type?: Tag;
  onChange: (priority: Tag) => void;
}

export default function RequirementTypePicker({ type, onChange }: Props) {
  const { projectId } = useParams();
  const { data: typeTags } = api.requirements.getRequirementTypeTags.useQuery({
    projectId: projectId as string,
  });

  return (
    <PillComponent
      currentTag={type}
      allTags={typeTags ?? []}
      callBack={onChange}
      labelClassName="w-full"
    />
  );
}
