"use client";

import { useParams } from "next/navigation";
import React from "react";
import { api } from "~/trpc/react";
import PillComponent from "./PillComponent";
import type { Tag } from "~/lib/types/firebaseSchemas";

interface Props {
  type?: Tag;
  onChange: (priority: Tag) => void;
  disabled?: boolean;
}

export default function RequirementTypePicker({
  type,
  onChange,
  disabled,
}: Props) {
  const { projectId } = useParams();
  const { data: typeTags } = api.requirements.getRequirementTypes.useQuery({
    projectId: projectId as string,
  });

  const { mutateAsync: createRequirementTypeTag } =
    api.requirements.createOrModifyRequirementType.useMutation();

  return (
    <PillComponent
      disabled={disabled}
      currentTag={type}
      allTags={typeTags ?? []}
      callBack={onChange}
      labelClassName="w-full"
      addTag={async (tag) => {
        const newTag = await createRequirementTypeTag({
          projectId: projectId as string,
          tagData: tag,
        });
        typeTags?.push(newTag);
        return newTag;
      }}
    />
  );
}
