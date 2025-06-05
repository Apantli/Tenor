"use client";

import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import MemberTable from "~/app/_components/inputs/MemberTable";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import RoleTable from "~/app/(logged)/project/[projectId]/settings/users/RoleTable";
import { SegmentedControl } from "~/app/_components/SegmentedControl";
import { useAlert } from "~/app/_hooks/useAlert";
import { checkPermissions } from "~/lib/defaultValues/permission";
import { emptyRole } from "~/lib/defaultValues/roles";
import type { UserCol } from "~/lib/types/columnTypes";
import type { UserPreview } from "~/lib/types/detailSchemas";
import {
  permissionNumbers,
  type Permission,
  type WithId,
} from "~/lib/types/firebaseSchemas";
import { api } from "~/trpc/react";
import { useInvalidateTeamMembers } from "~/app/_hooks/invalidateHooks";

export default function ProjectUsers() {
  const { projectId } = useParams();
  const { predefinedAlerts } = useAlert();
  const [section, setSection] = useState("Users");
  const { data: userTypes } = api.projects.getUserTypes.useQuery({
    projectId: projectId as string,
  });

  const { data: role } = api.settings.getMyRole.useQuery({
    projectId: projectId as string,
  });

  const invalidateTeamMembers = useInvalidateTeamMembers();

  const permission: Permission = useMemo(() => {
    return checkPermissions(
      {
        flags: ["settings"],
      },
      role ?? emptyRole,
    );
  }, [role]);

  // Users
  const { mutateAsync: addTeamMember } = api.users.addUser.useMutation();
  const { mutateAsync: removeTeamMember } = api.users.removeUser.useMutation();
  const { mutateAsync: updateTeamMemberRole } =
    api.users.updateUserRole.useMutation();

  // Roles
  const { mutateAsync: addRole } = api.settings.addRole.useMutation();
  const { mutateAsync: removeRole } = api.settings.removeRole.useMutation({
    onError(error, variables) {
      // look for role with roleId
      const role =
        roles?.find((role) => role.id === variables.roleId)?.label ??
        "NOT FOUND";
      predefinedAlerts.assignedRoleError(role);
    },
  });
  const { mutateAsync: updateRoleTabPermissions } =
    api.settings.updateRoleTabPermissions.useMutation();

  const utils = api.useUtils();
  const { data: teamMembers, refetch: refetch } =
    api.users.getUserTable.useQuery({
      projectId: projectId as string,
    });
  const { data: roles, refetch: refetchRoles } =
    api.settings.getDetailedRoles.useQuery({
      projectId: projectId as string,
    });

  const handleAddUser = async function (user: WithId<UserPreview>) {
    if (!teamMembers) return;
    const newData = teamMembers;
    const newTeamMember: UserCol = {
      ...user,
      roleId: emptyRole.id, // Ensure roleId is provided
    };
    newData.push(newTeamMember);

    // Uses optimistic update
    await utils.users.getUserTable.cancel({
      projectId: projectId as string,
    });
    utils.users.getUserTable.setData(
      { projectId: projectId as string },
      newData,
    );

    // Add to database
    await addTeamMember({
      projectId: projectId as string,
      userId: user.id,
    });
    await invalidateTeamMembers(projectId as string);
    await refetch();
  };

  const handleRemoveUser = async function (ids: (string | number)[]) {
    if (!teamMembers) return;
    //check if any of the ids belong to the owner
    ids = ids.filter((id) => {
      const user = teamMembers.find((user) => user.id === id);
      if (user?.roleId === "owner") {
        predefinedAlerts.removeOwnerError();
        return false;
      }
      return true;
    });
    const newData = teamMembers.filter((user) => !ids.includes(user.id));

    // Uses optimistic update
    await utils.users.getUserTable.cancel({
      projectId: projectId as string,
    });
    utils.users.getUserTable.setData(
      { projectId: projectId as string },
      newData,
    );

    // Deletes in database
    await Promise.all(
      ids.map((id) =>
        removeTeamMember({
          projectId: projectId as string,
          userId: id as string,
        }),
      ),
    );
    await invalidateTeamMembers(projectId as string);

    await refetch();
  };

  const handleUpdateUser = async function (id: string, role: string) {
    if (!teamMembers) return;
    const newData = teamMembers;
    const index = newData.findIndex((user) => user.id === id);
    if (newData[index]) {
      newData[index].roleId = role;
    } else {
      return;
    }

    // Uses optimistic update
    await utils.users.getUserTable.cancel({
      projectId: projectId as string,
    });
    utils.users.getUserTable.setData(
      { projectId: projectId as string },
      newData,
    );

    // Update role in database
    await Promise.all([
      updateTeamMemberRole({
        projectId: projectId as string,
        userId: id,
        roleId: role,
      }),
    ]);
    await invalidateTeamMembers(projectId as string);

    await refetch();
  };

  // Role handlers
  const handleRoleAdd = async function (label: string) {
    if (label === "") {
      predefinedAlerts.roleNameError();
      return;
    }
    if (
      roles?.some((role) => role.label.toLowerCase() === label.toLowerCase())
    ) {
      predefinedAlerts.existingRoleError(label);
      return;
    }

    // Add to database
    await addRole({
      projectId: projectId as string,
      label: label,
    });
    await refetchRoles(); // Refetch the list after adding
    await invalidateTeamMembers(projectId as string);
  };

  const handleRoleRemove = async function (ids: (string | number)[]) {
    await Promise.all(
      ids.map((id) =>
        removeRole({
          projectId: projectId as string,
          roleId: id as string,
        }),
      ),
    );

    await refetchRoles(); // Refetch the list after removing
    await invalidateTeamMembers(projectId as string);
  };

  const handleEditTabPermission = async function (
    roleId: string,
    parameter: string,
    permission: Permission,
  ) {
    if (!roles) return;
    const newData = roles.map((role) =>
      role.id === roleId
        ? {
            ...role,
            [parameter]: permission,
          }
        : role,
    );

    // Uses optimistic update
    await utils.settings.getDetailedRoles.cancel({
      projectId: projectId as string,
    });
    utils.settings.getDetailedRoles.setData(
      { projectId: projectId as string },
      newData,
    );

    // Update in database
    await updateRoleTabPermissions({
      projectId: projectId as string,
      roleId,
      parameter,
      permission,
    });
    await refetchRoles();
    await invalidateTeamMembers(projectId as string);
  };

  return (
    <div className="flex h-full w-full flex-col">
      <div className="mb-2 flex flex-row justify-between">
        <div className="flex w-full items-center justify-between">
          <h1 className="text-3xl font-semibold">Users & Permissions</h1>
          <SegmentedControl
            options={["Users", "Roles"]}
            selectedOption={section}
            onChange={setSection}
          ></SegmentedControl>
        </div>
      </div>
      {section === "Users" && (
        <>
          {teamMembers && userTypes && roles && (
            <MemberTable
              disabled={permission < permissionNumbers.write}
              label={undefined}
              teamMembers={teamMembers}
              handleMemberAdd={handleAddUser}
              handleMemberRemove={handleRemoveUser}
              handleEditMemberRole={handleUpdateUser}
              roleList={roles}
              isSearchable={true}
              className="w-full"
            />
          )}
          {!teamMembers && !userTypes && !roles && (
            <div className="flex h-full w-full flex-col items-center">
              <LoadingSpinner color="primary" />
            </div>
          )}
        </>
      )}
      {section === "Roles" && (
        <>
          {roles && (
            <RoleTable
              disabled={permission < permissionNumbers.write}
              isSearchable={true}
              roles={roles}
              handleRoleAdd={handleRoleAdd}
              handleRoleRemove={handleRoleRemove}
              handleEditTabPermission={handleEditTabPermission}
            ></RoleTable>
          )}
          {!roles && (
            <div className="flex h-full w-full flex-col items-center">
              <LoadingSpinner color="primary" />
            </div>
          )}
        </>
      )}
    </div>
  );
}
