"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import type { z } from "zod";
import type { FlagsRequired } from "~/lib/defaultValues/permission";
import { emptyRole } from "~/lib/defaultValues/roles";
import type { Permission } from "~/lib/types/firebaseSchemas";
import type { RoleSchema } from "~/lib/types/zodFirebaseSchema";
import { api } from "~/trpc/react";

export const checkPermissions = (
  flags: FlagsRequired,
  roleSchema: z.infer<typeof RoleSchema>,
) => {
  let userPermission: Permission = flags.optimistic ? 0 : 2;
  // Go through the flags and get the minimum permission
  flags.flags.forEach((flag) => {
    if (flags.optimistic) {
      userPermission = Math.max(
        userPermission,
        roleSchema[flag as keyof typeof roleSchema] as Permission,
      ) as Permission;
    } else {
      userPermission = Math.min(
        userPermission,
        roleSchema[flag as keyof typeof roleSchema] as Permission,
      ) as Permission;
    }
  });
  return userPermission;
};

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
