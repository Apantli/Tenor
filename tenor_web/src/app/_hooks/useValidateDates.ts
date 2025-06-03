import type { SprintDates } from "../(logged)/project/[projectId]/sprints/CreateSprintPopup";
import { useAlert } from "./useAlert";

export default function useValidateDate() {
  const { predefinedAlerts } = useAlert();
  const isValidDates = ({
    startDate,
    endDate,
    otherSprints = [],
  }: {
    startDate: Date;
    endDate: Date;
    otherSprints: SprintDates[] | undefined;
  }) => {
    if (startDate === undefined || endDate === undefined) return false;

    // Validate date order
    if (startDate >= endDate) {
      predefinedAlerts.sprintDatesError();
      return false;
    }

    // Validate that the sprint does not overlap with other sprints
    for (const sprint of otherSprints ?? []) {
      if (
        (sprint.startDate <= startDate && sprint.endDate >= startDate) ||
        (sprint.startDate <= endDate && sprint.endDate >= endDate) ||
        (startDate <= sprint.startDate && endDate >= sprint.startDate) ||
        (startDate <= sprint.endDate && endDate >= sprint.endDate)
      ) {
        predefinedAlerts.sprintDateCollideError(sprint.number);
        return false;
      }
    }
    return true;
  };

  return isValidDates;
}
