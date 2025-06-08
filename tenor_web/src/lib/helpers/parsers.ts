import { Timestamp } from "firebase/firestore";

export const timestampToDate = (timestamp: {
  seconds?: number;
  nanoseconds?: number;
  _seconds?: number;
  _nanoseconds?: number;
}) => {
  const seconds = timestamp.seconds ?? timestamp._seconds;
  const nanoseconds = timestamp.nanoseconds ?? timestamp._nanoseconds;

  if (seconds === undefined) {
    throw new Error("Either 'seconds' or '_seconds' must be defined");
  }

  return new Timestamp(seconds, nanoseconds ?? 0).toDate();
};

/**
 * @function formatSeconds
 * @description Formats an amount of seconds to a string that may include hourse, minutes, or seconds;
 * @param seconds The number of seconds
 * @returns {String} A string in the format {hours}h {minutes}m.
 */
export const formatSeconds = (seconds: number | undefined): string => {
  if (seconds === undefined || seconds < 0) {
    return "-";
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours === 0 && minutes === 0 && secs === 0) {
    return "0s";
  }

  const formattedTime = `${hours > 0 ? `${hours}h ` : ""}${minutes > 0 ? `${minutes}m ` : ""}`;
  if (hours === 0 && minutes == 0) return formattedTime + ` ${secs}s`;
  return formattedTime;
};

export const dateToString = (date: Date): string | null => {
  if (!date) return null;

  const normalizedDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  const year = normalizedDate.getFullYear();
  const month = String(normalizedDate.getMonth() + 1).padStart(2, "0");
  const day = String(normalizedDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const createEndOfDayDate = (
  year: number,
  month: number,
  day: number,
): Date => {
  const date = new Date(year, month, day, 23, 59, 59, 999);
  return date;
};

export const normalizeToStartOfDay = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};
