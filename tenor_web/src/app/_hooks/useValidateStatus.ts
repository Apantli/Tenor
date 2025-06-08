import { api } from "~/trpc/react";
import { useAlert } from "./useAlert";
import { useParams } from "next/navigation";
import type { StatusTag, WithId } from "~/lib/types/firebaseSchemas";

export default function useValidateStatusTag() {
  const { projectId } = useParams();
  const { predefinedAlerts } = useAlert();
  const { data: statusTags } = api.settings.getStatusTypes.useQuery({
    projectId: projectId as string,
    showAwaitingReview: true,
  });

  const validateStatusTag = (tag: WithId<StatusTag>) => {
    if (tag.name === "") {
      predefinedAlerts.statusNameError();
      return false;
    }

    // Normalize the input for case-insensitive comparison

    const protectedNames = ["Todo", "Doing", "Done", "Awaits Review"];

    const normalizedName = tag.name.toLowerCase().trim();

    // Check if the previous name is one of the protected names
    if (tag.id) {
      const previousStatus = statusTags?.find(
        (status) => status.id === tag.id && !status.deleted,
      );

      if (
        previousStatus &&
        protectedNames.some(
          (name) => previousStatus.name.toLowerCase() === name.toLowerCase(),
        )
      ) {
        predefinedAlerts.defaultStatusNotModifiableError(previousStatus.name);
        return false;
      }
    }

    if (
      protectedNames.some(
        (name) => normalizedName === name.toLowerCase().trim(),
      )
    ) {
      predefinedAlerts.statusNameReservedError(tag.name);
      return false;
    }

    const statusAlreadyExists = statusTags?.some(
      (status) =>
        status.name.toLowerCase().trim() === normalizedName &&
        !status.deleted &&
        status.id !== tag.id, // Ensure it's not itself
    );

    if (statusAlreadyExists) {
      predefinedAlerts.existingStatusError(tag.name);
      return false;
    }

    return true;
  };

  return validateStatusTag;
}
