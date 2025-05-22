"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import {
  checkPermissions,
  emptyRole,
  type FlagsRequired,
} from "~/lib/defaultProjectValues";
import type { Permission } from "~/lib/types/firebaseSchemas";
import { api } from "~/trpc/react";

export const useGetPermission = (flags: FlagsRequired) => {
  const { projectId } = useParams();
  const { data: role } = api.settings.getMyRole.useQuery({
    projectId: projectId as string,
  });
  const permission: Permission = useMemo(() => {
    return checkPermissions(flags, role ?? emptyRole);
  }, [role]);
  return permission;
};
