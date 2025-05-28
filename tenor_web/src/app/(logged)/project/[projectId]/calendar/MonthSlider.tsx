"use client";

import { useDroppable } from "@dnd-kit/react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { dateToString } from "~/lib/helpers/parsers";

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

  const leftButtonId = dateToString(new Date(year, month - 1, 1))!;
  const rightButtonId = dateToString(new Date(year, month + 1, 1))!;

  const { ref: leftRef, isDropTarget: isLeftDropTarget } = useDroppable({
    id: leftButtonId,
  });
  const { ref: rightRef, isDropTarget: isRightDropTarget } = useDroppable({
    id: rightButtonId,
  });

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div
        ref={leftRef}
        className="rounded hover:bg-gray-100"
        onMouseEnter={() => {
          if (isLeftDropTarget) {
            prevMonth();
          }
        }}
      >
        <button disabled={isLeftDropTarget} onClick={prevMonth}>
          <ChevronLeftIcon />
        </button>
      </div>
      <div className="flex min-w-[120px] items-center justify-center">
        <h1
          className="text-lg"
          style={{ width: "4ch", textAlign: "center", display: "inline-block" }}
        >
          {months[month]}
        </h1>
        <h1
          className="text-lg"
          style={{ width: "4ch", textAlign: "center", display: "inline-block" }}
        >
          {year}
        </h1>
      </div>
      <div
        className="rounded hover:bg-gray-100"
        ref={rightRef}
        onMouseEnter={() => {
          if (isRightDropTarget) {
            nextMonth();
          }
        }}
      >
        <button disabled={isRightDropTarget} onClick={nextMonth}>
          <ChevronRightIcon />
        </button>
      </div>
    </div>
  );
}
