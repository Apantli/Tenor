"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import MemberTable, { TeamMember } from "~/app/_components/inputs/MemberTable";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import { emptyRole } from "~/lib/defaultTags";
import { api } from "~/trpc/react";

export default function ProjectUsers() {
  const { projectId } = useParams();
  const { data: userTypes } = api.projects.getUserTypes.useQuery({
    projectId: projectId as string,
  });

  const { mutateAsync: addTeamMember } = api.users.addUser.useMutation();
  const { mutateAsync: deleteTeamMember } = api.users.removeUser.useMutation();
  const { mutateAsync: updateTeamMemberRole } =
    api.users.updateUserRole.useMutation();

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

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex flex-row justify-between">
        <h1 className="mb-4 text-3xl font-semibold">Users & Permissions</h1>
      </div>
      {teamMembers && userTypes ? (
        <MemberTable
          label={undefined}
          teamMembers={teamMembers}
          handleMemberAdd={handleAddUser}
          handleMemberRemove={handleRemoveUser}
          handleEditMemberRole={handleUpdateUser}
          roleList={userTypes}
          isSearchable={true}
          className="w-full"
        />
      ) : (
        <div className="mt-5 flex flex-row gap-x-3">
          <LoadingSpinner />
          <p className="text-lg font-bold">Loading...</p>
        </div>
      )}
    </div>
  );
}
