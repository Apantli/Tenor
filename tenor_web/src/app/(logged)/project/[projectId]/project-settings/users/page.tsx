"use client";

import { useParams } from "next/navigation";
import MemberTable, { TeamMember } from "~/app/_components/inputs/MemberTable";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import { api } from "~/trpc/react";

export default function ProjectUsers() {
  const { projectId } = useParams();
  const { data: userTypes } = api.projects.getUserTypes.useQuery({
    projectId: projectId as string,
  });
  const { data: teamMembers } = api.users.getTeamMembers.useQuery({
    projectId: projectId as string,
  });

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex flex-row justify-between">
        <h1 className="mb-4 text-3xl font-semibold">Users & Permissions</h1>
      </div>
      {teamMembers && userTypes ? (
        <MemberTable
          label={undefined}
          teamMembers={teamMembers}
          handleMemberAdd={function (user: TeamMember): void {
            throw new Error("Function not implemented.");
          }}
          handleMemberRemove={function (id: (string | number)[]): void {
            throw new Error("Function not implemented.");
          }}
          handleEditMemberRole={function (id: string, role: string): void {
            throw new Error("Function not implemented.");
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
