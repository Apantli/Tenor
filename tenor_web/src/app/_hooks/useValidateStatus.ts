import { api } from "~/trpc/react";
import { useAlert } from "./useAlert";
import { useParams } from "next/navigation";

export default function useValidateStatusTag() {
  const { projectId } = useParams();
  const { predefinedAlerts } = useAlert();
  const { data: statusTags } = api.settings.getStatusTypes.useQuery({
    projectId: projectId as string,
  });
  const validateStatusTag = ({
    // If id, it will ignore itself as existing tag
    id,
    tagName,
  }: {
    id?: string;
    tagName: string;
  }) => {
    if (tagName === "") {
      predefinedAlerts.statusNameError();
      return false;
    }

    // Normalize the input for case-insensitive comparison
    const normalizedName = tagName.toLowerCase().trim();
    const protectedNames = ["Todo", "Doing", "Done", "Awaits Review"];

    // Check if the previous name is one of the protected names
    if (id) {
      const previousStatus = statusTags?.find(
        (status) => status.id === id && !status.deleted,
      );
      if (previousStatus && previousStatus.name === tagName) {
        return true;
      }
      if (
        previousStatus &&
        protectedNames.some(
          (name) => previousStatus.name.toLowerCase() === name.toLowerCase(),
        )
      ) {
        predefinedAlerts.statusNameNotEditableError();
        return false;
      }
    }

    if (
      protectedNames.some(
        (name) => normalizedName === name.toLowerCase().trim(),
      )
    ) {
      predefinedAlerts.statusNameReservedError(tagName);
      return false;
    }

    const statusAlreadyExists = statusTags?.some(
      (status) =>
        status.name.toLowerCase().trim() === normalizedName &&
        !status.deleted &&
        status.id !== id, // Ensure it's not itself
    );

    if (statusAlreadyExists) {
      predefinedAlerts.existingStatusError(tagName);
      return false;
    }

    return true;
  };

  return validateStatusTag;
}
