"use client";

import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import { useAlert } from "~/app/_hooks/useAlert";
import { permissionLabels } from "~/lib/types/firebaseSchemas";

export default function ProjectOverview() {
  const { projectId } = useParams();
  const { data: role } = api.settings.getMyRole.useQuery({
    projectId: projectId as string,
  });

  const { alert } = useAlert();
  const { mutateAsync: testPermissionWrite } =
    api.settings.testingMutationWrite.useMutation({
      onError: (error) => {
        alert(
          "Oops...",
          `You do not have permission to write to this project. ${error.message}`,
          {
            type: "error",
            duration: 5000,
          },
        );
      },
      onSuccess: () => {
        alert("Success", "You have permission to write to this project.", {
          type: "success",
          duration: 5000,
        });
      },
    });

  const { mutateAsync: testPermissionRead } =
    api.settings.testingMutationRead.useMutation({
      onError: (error) => {
        alert(
          "Oops...",
          `You do not have permission to read to this project. ${error.message}`,
          {
            type: "error",
            duration: 5000,
          },
        );
      },
      onSuccess: () => {
        alert("Success", "You have permission to read to this project.", {
          type: "success",
          duration: 5000,
        });
      },
    });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Project overview</h1>
      <p>Project Id: {projectId}</p>
      <p>My role: {role?.label}</p>
      <p>
        My role: {role?.label}. Permission{" "}
        {
          permissionLabels[
            (role?.settings as keyof typeof permissionLabels) ?? 0
          ]
        }
      </p>
      <div className="mb-4 mt-2 flex flex-row gap-2">
        <PrimaryButton
          onClick={async () => {
            await testPermissionWrite({
              projectId: projectId as string,
            });
          }}
        >
          Test Write
        </PrimaryButton>
        <PrimaryButton
          onClick={async () => {
            await testPermissionRead({
              projectId: projectId as string,
            });
          }}
        >
          Test Read
        </PrimaryButton>
      </div>
    </div>
  );
}
