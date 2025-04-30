"use client";

import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import MemberTable, { TeamMember } from "~/app/_components/inputs/MemberTable";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import RoleTable from "~/app/_components/sections/RoleTable";
import { SegmentedControl } from "~/app/_components/SegmentedControl";
import { useAlert } from "~/app/_hooks/useAlert";
import { defaultRoleList, emptyRole } from "~/lib/defaultTags";
import { Permission, Role } from "~/lib/types/firebaseSchemas";
import { api } from "~/trpc/react";

export default function ProjectUsers() {
  const { projectId } = useParams();
  const { alert } = useAlert();
  const [section, setSection] = useState("Users");
  const { data: userTypes } = api.projects.getUserTypes.useQuery({
    projectId: projectId as string,
  });

  // Users
  const { mutateAsync: addTeamMember } = api.users.addUser.useMutation();
  const { mutateAsync: removeTeamMember } = api.users.removeUser.useMutation();
  const { mutateAsync: updateTeamMemberRole } =
    api.users.updateUserRole.useMutation();

  // Roles
  const { mutateAsync: addRole } = api.settings.addRole.useMutation();
  const { mutateAsync: removeRole } = api.settings.removeRole.useMutation({
    onError(error, variables, context) {
      // look for role with roleId
      const role =
        roles?.find((role) => role.id === variables.roleId)?.label ??
        "NOT FOUND";
      alert(
        "Oops...",
        `You cannot delete the ${role} role because it is assigned to a user.`,
        {
          type: "error",
          duration: 5000,
        },
      );
    },
  });
  const { mutateAsync: updateRoleTabPermissions } =
    api.settings.updateRoleTabPermissions.useMutation();
  const { mutateAsync: updateViewPerformance } =
    api.settings.updateViewPerformance.useMutation();
  const { mutateAsync: updateControlSprints } =
    api.settings.updateControlSprints.useMutation();

  const utils = api.useUtils();
  const {
    data: teamMembers,
    isLoading: isLoadingUS,
    refetch: refetch,
  } = api.users.getTeamMembers.useQuery({
    projectId: projectId as string,
  });
  const { data: roles, refetch: refetchRoles } =
    api.settings.getDetailedRoles.useQuery({
      projectId: projectId as string,
    });

  const handleAddUser = async function (user: TeamMember) {
    if (!teamMembers) return;
    const newData = teamMembers;
    newData.push(user);

    // Uses optimistic update
    await utils.users.getTeamMembers.cancel({
      projectId: projectId as string,
    });
    utils.users.getTeamMembers.setData(
      { projectId: projectId as string },
      newData,
    );

    // Add to database
    await addTeamMember({
      projectId: projectId as string,
      userId: user.id,
    });
    await refetch();
  };

  const handleRemoveUser = async function (ids: (string | number)[]) {
    if (!teamMembers) return;
    const newData = teamMembers.filter((user) => !ids.includes(user.id));

    // Uses optimistic update
    await utils.users.getTeamMembers.cancel({
      projectId: projectId as string,
    });
    utils.users.getTeamMembers.setData(
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
    await refetch();
  };

  const handleUpdateUser = async function (id: string, role: string) {
    if (!teamMembers) return;
    const newData = teamMembers;
    const index = newData.findIndex((user) => user.id === id);
    if (newData[index]) {
      newData[index].role = role;
    } else {
      return;
    }

    // Uses optimistic update
    await utils.users.getTeamMembers.cancel({
      projectId: projectId as string,
    });
    utils.users.getTeamMembers.setData(
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
    await refetch();
  };

  // Role handlers
  const handleRoleAdd = async function (label: string) {
    // Add to database
    await addRole({
      projectId: projectId as string,
      label: label,
    });
    await refetchRoles(); // Refetch the list after adding
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
  };

  const handleEditTabPermission = async function (
    roleId: string,
    tabId: string,
    permission: Permission,
  ) {
    if (!roles) return;
    const newData = roles.map((role) =>
      role.id === roleId
        ? {
            ...role,
            [tabId]: permission,
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
      tabId,
      permission,
    });
    await refetchRoles();
  };

  const handleUpdateViewPerformance = async function (
    roleId: string,
    newValue: boolean,
  ) {
    if (!roles) return;
    const newData = roles.map((role) =>
      role.id === roleId
        ? {
            ...role,
            canViewPerformance: newValue,
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
    await updateViewPerformance({
      projectId: projectId as string,
      roleId,
      newValue,
    });
    await refetchRoles();
  };

  const handleUpdateControlSprints = async function (
    roleId: string,
    newValue: boolean,
  ) {
    if (!roles) return;
    const newData = roles.map((role) =>
      role.id === roleId
        ? {
            ...role,
            canControlSprints: newValue,
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
    await updateControlSprints({
      projectId: projectId as string,
      roleId,
      newValue,
    });
    await refetchRoles();
  };

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex flex-row justify-between">
        <div className="flex w-full items-center justify-between">
          <h1 className="text-3xl font-semibold">Users & Permissions</h1>
          <SegmentedControl
            options={["Users", "Roles"]}
            selectedOption={section}
            onChange={setSection}
          ></SegmentedControl>
        </div>
      </div>
      {section === "Users" ? (
        teamMembers && userTypes && roles ? (
          <MemberTable
            label={undefined}
            teamMembers={teamMembers}
            handleMemberAdd={handleAddUser}
            handleMemberRemove={handleRemoveUser}
            handleEditMemberRole={handleUpdateUser}
            roleList={roles}
            isSearchable={true}
            className="w-full"
          />
        ) : (
          <div className="mt-5 flex flex-row gap-x-3">
            <LoadingSpinner />
            <p className="text-lg font-bold">Loading...</p>
          </div>
        )
      ) : roles ? (
        <RoleTable
          isSearchable={true}
          roles={roles}
          handleRoleAdd={handleRoleAdd}
          handleRoleRemove={handleRoleRemove}
          handleEditTabPermission={handleEditTabPermission}
          handleUpdateViewPerformance={handleUpdateViewPerformance}
          handleUpdateControlSprints={handleUpdateControlSprints}
        ></RoleTable>
      ) : (
        <div className="mt-5 flex flex-row gap-x-3">
          <LoadingSpinner />
          <p className="text-lg font-bold">Loading...</p>
        </div>
      )}
    </div>
  );
}
