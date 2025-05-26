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

export const dateToString = (date: Date) => {
  return date.toISOString().split("T")[0];
};
