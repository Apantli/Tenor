// hooks/useSprintCountdown.ts
import { useState, useEffect } from "react";
import { timestampToDate } from "~/lib/helpers/parsers";

type FirebaseTimestamp = {
  seconds?: number;
  nanoseconds?: number;
  _seconds?: number;
  _nanoseconds?: number;
};

type EndDateType = FirebaseTimestamp | Date | null;

export const useRetrospectiveCountdown = (endDate: EndDateType) => {
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    if (!endDate) return;

    const updateCountdown = () => {
      try {
        let sprintEndDate: Date;
        if (endDate instanceof Date) {
          sprintEndDate = endDate;
        } else {
          sprintEndDate = timestampToDate(endDate);
        }

        const expirationDate = new Date(
          sprintEndDate.getTime() + 3 * 24 * 60 * 60 * 1000,
        );
        const now = new Date();
        const timeDiff = expirationDate.getTime() - now.getTime();

        if (timeDiff <= 0) {
          setTimeRemaining("Expirado");
          setIsExpired(true);
          return;
        }

        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        );
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

        let timeString = "";
        if (days > 0) timeString += `${days}d `;
        if (hours > 0) timeString += `${hours}h `;
        if (minutes > 0 || timeString === "") timeString += `${minutes}m`;

        setTimeRemaining(timeString.trim());
        setIsExpired(false);
      } catch (error) {
        console.error("Error calculating countdown:", error);
        setTimeRemaining("Error");
        setIsExpired(true);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);

    return () => clearInterval(interval);
  }, [endDate]);

  return { timeRemaining, isExpired };
};
