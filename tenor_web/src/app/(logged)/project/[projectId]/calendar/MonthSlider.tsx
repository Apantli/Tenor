"use client";

// import { useDroppable } from "@dnd-kit/react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

interface Props {
  month: number;
  setMonth: (month: number) => void;
  year: number;
  setYear: (year: number) => void;
}

export default function MonthSlider({ month, setMonth, year, setYear }: Props) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // const { leftRef, isDropTarget } = useDroppable({ id: day });

  return (
    <div className="flex items-center justify-between">
      <button
        onClick={() => {
          if (month === 0) {
            setMonth(11);
            setYear(year - 1);
          } else {
            setMonth(month - 1);
          }
        }}
      >
        <ChevronLeftIcon />
      </button>
      <div className="flex min-w-[120px] items-center justify-center">
        <h1 className="text-lg">
          {months[month]} {year}
        </h1>
      </div>
      <button
        onClick={() => {
          if (month === 11) {
            setMonth(0);
            setYear(year + 1);
          } else {
            setMonth(month + 1);
          }
        }}
      >
        <ChevronRightIcon />
      </button>
    </div>
  );
}
