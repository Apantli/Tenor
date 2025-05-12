"use client";

import { useParams } from "next/navigation";
import React from "react";
import { api } from "~/trpc/react";
import PillComponent from "../PillComponent";
import type { Tag } from "~/lib/types/firebaseSchemas";

interface Props {
  focus?: Tag;
  onChange: (priority: Tag) => void;
  disabled?: boolean;
}

export default function RequirementFocusPicker({
  focus,
  onChange,
  disabled,
}: Props) {
  const { projectId } = useParams();
  const { data: focusTags } = api.requirements.getRequirementFocuses.useQuery({
    projectId: projectId as string,
  });

  const { mutateAsync: createRequirementTypeTag } =
    api.requirements.createOrModifyRequirementFocus.useMutation();

  return (
    <PillComponent
      disabled={disabled}
      currentTag={focus}
      allTags={focusTags ?? []}
      callBack={onChange}
      labelClassName="w-full"
      addTag={async (tag) => {
        const newTag = await createRequirementTypeTag({
          projectId: projectId as string,
          tagData: tag,
        });
        focusTags?.push(newTag);
        return newTag;
      }}
    />
  );
}
