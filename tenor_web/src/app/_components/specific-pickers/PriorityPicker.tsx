"use client";

import { useParams } from "next/navigation";
import React from "react";
import { api } from "~/trpc/react";
import PillComponent from "../PillComponent";
import type { Tag, WithId } from "~/lib/types/firebaseSchemas";

interface Props {
  priority?: Tag;
  onChange: (priority: Tag) => void;
  disabled?: boolean;
}

export default function PriorityPicker({
  priority,
  onChange,
  disabled,
}: Props) {
  const { projectId } = useParams();
  const { data: priorities } = api.settings.getPriorityTypes.useQuery({
    projectId: projectId as string,
  });

  return (
    <PillComponent
      disabled={disabled}
      currentTag={priority}
      allTags={priorities ?? []}
      callBack={onChange}
      labelClassName="w-full"
    />
  );
}
