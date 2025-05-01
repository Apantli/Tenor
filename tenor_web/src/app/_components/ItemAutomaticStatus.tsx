"use client";

import React from "react";
import { api } from "~/trpc/react";
import { useParams } from "next/navigation";

interface Props {
  itemId: string;
}

export default function ItemAutomaticStatus({ itemId }: Props) {
  const { projectId } = useParams();
  const { data: automaticStatus } = api.kanban.getItemAutomaticStatus.useQuery({
    projectId: projectId as string,
    itemId: itemId,
  });

  const isUndefined = () => {
    return automaticStatus?.name === null;
  };

  return isUndefined() ? null : (
    <div className="mt-1 flex items-center justify-start text-sm text-gray-500">
      <strong>Current Status:</strong>
      &nbsp;{automaticStatus?.name ?? "Loading..."}
    </div>
  );
}
