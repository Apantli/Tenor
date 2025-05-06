import { Timestamp } from "firebase/firestore";

export const timestampToDate = (timestamp: {
  seconds: number;
  nanoseconds: number;
}) => {
  return new Timestamp(timestamp.seconds, timestamp.nanoseconds).toDate();
};
