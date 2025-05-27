import React, { useState } from "react";
import { UserPreview } from "~/lib/types/detailSchemas";
import type { Sprint, Tag, WithId } from "~/lib/types/firebaseSchemas";

export interface AdvancedSearchFilters {
  tags: WithId<Tag>[];
  sizes: WithId<Tag>[];
  priorities: WithId<Tag>[];
  assignee: WithId<UserPreview> | undefined;
  sprint: WithId<Sprint> | undefined;
}

export default function useAdvancedSearchFilters() {
  return useState<AdvancedSearchFilters>({
    tags: [],
    sizes: [],
    priorities: [],
    assignee: undefined,
    sprint: undefined,
  });
}
