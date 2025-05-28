type PossibleDate =
  | Date
  | { _seconds: number }
  | { seconds: number }
  | { toDate: () => Date }
  | string
  | number;

export const getRelativeTimeString = (date: PossibleDate): string => {
  if (!date) return '';
  let jsDate: Date | null = null;
  if (typeof date === 'object' && date !== null) {
    if ('_seconds' in date) {
      jsDate = new Date(date._seconds * 1000);
    } else if ('seconds' in date) {
      jsDate = new Date(date.seconds * 1000);
    } else if (date instanceof Date) {
      jsDate = date;
    } else if (typeof (date as { toDate?: () => Date }).toDate === 'function') {
      jsDate = (date as { toDate: () => Date }).toDate();
    } else {
      jsDate = new Date((date as unknown) as string | number);
    }
  } else {
    jsDate = new Date(date);
  }
  if (!jsDate || isNaN(jsDate.getTime())) return '';
  // Resto de la función igual
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - jsDate.getTime()) / 1000);
  const MINUTE = 60;
  const HOUR = 3600;
  const DAY = 86400;
  const WEEK = 604800;
  const MONTH = 2419200;
  const YEAR = 29030400;
  if (diffInSeconds < MINUTE) {
    return 'just now';
  } else if (diffInSeconds < HOUR) {
    const minutes = Math.floor(diffInSeconds / MINUTE);
    return `${minutes} ${minutes === 1 ? 'min' : 'mins'} ago`;
  } else if (diffInSeconds < DAY) {
    const hours = Math.floor(diffInSeconds / HOUR);
    return `${hours} ${hours === 1 ? 'hr' : 'hrs'} ago`;
  } else if (diffInSeconds < WEEK) {
    const days = Math.floor(diffInSeconds / DAY);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  } else if (diffInSeconds < MONTH) {
    const weeks = Math.floor(diffInSeconds / WEEK);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else if (diffInSeconds < YEAR) {
    const months = Math.floor(diffInSeconds / MONTH);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  } else {
    const years = Math.floor(diffInSeconds / YEAR);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
  }
};
