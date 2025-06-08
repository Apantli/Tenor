"use client";

import React, { useState } from "react";
import { cn } from "~/lib/helpers/utils";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Dropdown from "~/app/_components/Dropdown";

interface DatePickerProps {
  onChange: (date: Date | undefined) => void;
  selectedDate?: Date | undefined;
  className?: string;
  assignDataAt?: "beginOfDay" | "endOfDay";
  placeholder?: string;
  disabled?: boolean;
}

export function DatePicker({
  onChange,
  selectedDate = undefined,
  className,
  assignDataAt = "endOfDay",
  placeholder = "No date",
  disabled = false,
}: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate ?? new Date());
  const [dropdownClose, setDropdownClose] = useState(false);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleDateSelect = (date: Date) => {
    if (assignDataAt === "beginOfDay") {
      const newDate = new Date(date);
      newDate.setHours(0, 0, 0, 0);
      onChange(newDate);
    } else {
      const newDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        23,
        59,
        59,
        999,
      );
      onChange(newDate);
    }
    setDropdownClose(true);
    setTimeout(() => setDropdownClose(false), 10);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onChange(undefined);
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const isSelectedDate = (date: Date) => {
    return (
      selectedDate &&
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const DatePickerTrigger = (
    <div
      className={cn(
        "flex h-12 w-full items-center justify-between rounded-lg border border-gray-300 p-2 transition-colors",
        !disabled && "cursor-pointer hover:bg-gray-200",
      )}
    >
      <CalendarMonthIcon
        className={cn(
          "mr-2 h-5 w-5 text-gray-700",
          !disabled && "cursor-pointer",
        )}
      />
      <div className="flex flex-grow items-center">
        <div
          className={cn(
            "font-medium text-gray-700",
            !disabled && "cursor-pointer",
          )}
        >
          {selectedDate
            ? formatDate(selectedDate)
            : disabled
              ? "None"
              : placeholder}
        </div>
      </div>
      {selectedDate && !disabled && (
        <div
          onClick={handleClear}
          className="ml-2 text-gray-500 transition-colors hover:text-gray-700"
        >
          <CloseIcon className="h-5 w-5" />
        </div>
      )}
    </div>
  );

  const CalendarContent = (
    <div
      className="w-[280px] bg-white p-3"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setCurrentMonth(
              new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1),
            );
          }}
          className="rounded p-1 hover:bg-gray-100"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <h2 className="text-md font-semibold">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setCurrentMonth(
              new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1),
            );
          }}
          className="rounded p-1 hover:bg-gray-100"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Days of week */}
      <div className="mb-1 grid grid-cols-7 gap-0.5">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="p-1 text-center text-xs font-medium text-gray-500"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-0.5">
        {getDaysInMonth(currentMonth).map((date, index) => (
          <div key={index} className="aspect-square">
            {date && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDateSelect(date);
                }}
                className={cn(
                  "flex h-full w-full items-center justify-center rounded text-xs transition-colors hover:bg-app-light",
                  isSelectedDate(date) &&
                    "bg-app-secondary text-white hover:bg-app-secondary-dark",
                  isToday(date) &&
                    !isSelectedDate(date) &&
                    "bg-gray-200 font-semibold",
                )}
              >
                {date.getDate()}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div data-cy="datepicker" className={cn("relative", className)}>
      <Dropdown
        label={DatePickerTrigger}
        disabled={disabled}
        close={dropdownClose}
        className="w-full"
        menuClassName="bg-app-primary overflow-hidden"
        place="bottom"
      >
        {CalendarContent}
      </Dropdown>
    </div>
  );
}
