import { useState } from "react";
import { useAlert } from "./useAlert";

export default function useCharacterLimit(label: string, limit: number) {
  const [limitErrorShown, setLimitErrorShown] = useState(false);
  const { predefinedAlerts } = useAlert();

  const isWithinLimit = (value: string) => {
    if (value.length > limit) {
      if (!limitErrorShown) {
        predefinedAlerts.tooLongText(label, limit);
        setLimitErrorShown(true);
      }
      return false;
    } else {
      setLimitErrorShown(false);
    }
    return true;
  };

  return isWithinLimit;
}
