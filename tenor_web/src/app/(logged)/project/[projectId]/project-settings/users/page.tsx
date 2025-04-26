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

  let userTypesList = useMemo(() => {
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

  const onUserAdded = async (userStoryId: string) => {
    await refetch();
  };
  // const onUserRemoved = async (userStoryId: string) => {
  //   await refetch();
  // }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex flex-row justify-between">
        <h1 className="mb-4 text-3xl font-semibold">Users & Permissions</h1>
      </div>
      {teamMembers && userTypes ? (
        <MemberTable
          label={undefined}
          teamMembers={teamMembers}
          handleMemberAdd={async function (user: TeamMember) {
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
            await Promise.all([
              addTeamMember({
                projectId: projectId as string,
                userId: user.id as string,
              }),
            ]);
            await refetch();
          }}
          handleMemberRemove={async function (ids: (string | number)[]) {
            const newData = teamMembers.filter(
              (userStory) => !ids.includes(userStory.id),
            );

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
          }}
          handleEditMemberRole={async function (id: string, role: string) {
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
          }}
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
