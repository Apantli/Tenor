"use client";

import { useParams } from "next/navigation";
import React from "react";
import { api } from "~/trpc/react";
import PillComponent from "../PillComponent";
import type { Tag } from "~/lib/types/firebaseSchemas";

interface Props {
  focus?: Tag;
  onChange: (priority: Tag) => void;
}

export default function RequirementFocusPicker({ focus, onChange }: Props) {
  const { projectId } = useParams();
  const { data: focusTags } = api.requirements.getRequirementFocusTags.useQuery(
    {
      projectId: projectId as string,
    },
  );

  return (
    <PillComponent
      currentTag={focus}
      allTags={focusTags ?? []}
      callBack={onChange}
      labelClassName="w-full"
    />
  );
}
