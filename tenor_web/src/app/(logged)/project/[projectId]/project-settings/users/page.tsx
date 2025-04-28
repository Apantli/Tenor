"use client";

import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import MemberTable, { TeamMember } from "~/app/_components/inputs/MemberTable";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import RoleList from "~/app/_components/sections/RoleList";
import { SegmentedControl } from "~/app/_components/SegmentedControl";
import { defaultRoleList, emptyRole } from "~/lib/defaultTags";
import { Role } from "~/lib/types/firebaseSchemas";
import { api } from "~/trpc/react";

export default function ProjectUsers() {
  const { projectId } = useParams();
  const [section, setSection] = useState("Roles");
  const { data: userTypes } = api.projects.getUserTypes.useQuery({
    projectId: projectId as string,
  });

  // Users
  const { mutateAsync: addTeamMember } = api.users.addUser.useMutation();
  const { mutateAsync: deleteTeamMember } = api.users.removeUser.useMutation();
  const { mutateAsync: updateTeamMemberRole } =
    api.users.updateUserRole.useMutation();

  // Roles
  const { data: roles, refetch: refetchRoles } =
    api.settings.getDetailedRoles.useQuery({
      projectId: projectId as string,
    });
  const { mutateAsync: addRole } = api.settings.addRole.useMutation();
  const { mutateAsync: deleteRole } = api.settings.removeRole.useMutation();

  // FIXME: This is not used
  const userTypesList = useMemo(() => {
    if (userTypes && !userTypes.includes(emptyRole)) {
      userTypes.push(emptyRole);
    }
    return [];
  }, [userTypes]);

  const utils = api.useUtils();
  const {
    data: teamMembers,
    isLoading: isLoadingUS,
    refetch: refetch,
  } = api.users.getTeamMembers.useQuery({
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
        deleteTeamMember({
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
    // Deletes in database
    await Promise.all(
      ids.map((id) =>
        deleteRole({
          projectId: projectId as string,
          roleId: id as string,
        }),
      ),
    );
    await refetchRoles(); // Refetch the list after removing
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
        <RoleList
          isSearchable={true}
          roles={roles}
          handleRoleAdd={handleRoleAdd}
          handleRoleRemove={handleRoleRemove}
        ></RoleList>
      ) : (
        <div className="mt-5 flex flex-row gap-x-3">
          <LoadingSpinner />
          <p className="text-lg font-bold">Loading...</p>
        </div>
      )}
    </div>
  );
}
