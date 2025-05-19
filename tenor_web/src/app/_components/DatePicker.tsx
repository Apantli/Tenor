"use client";

import React, { useRef } from "react";
import { cn } from "~/lib/utils";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CloseIcon from "@mui/icons-material/Close";

interface DatePickerProps {
  onChange: (date: Date | undefined) => void;
  selectedDate?: Date | undefined;
  className?: string;
  placeholder?: string;
}

export function DatePicker({
  onChange,
  selectedDate = undefined,
  className,
  placeholder = "No date",
}: DatePickerProps) {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const formatDate = (date: Date): string => {
    console.log("Formatting date:", date);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) {
      onChange(undefined);
      return;
    }
    const newDate = new Date(`${e.target.value}T23:59:59`);
    onChange(newDate);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
  };

  const openDatePicker = () => {
    if (dateInputRef.current) {
      dateInputRef.current.showPicker();
    }
  };

  return (
    <div
      data-cy="datepicker"
      className={cn("relative", className)}
      onClick={openDatePicker}
    >
      <div className="flex h-12 cursor-pointer items-center justify-between rounded-lg border border-gray-300 p-2 transition-colors hover:bg-gray-200">
        <CalendarMonthIcon className="mr-2 h-5 w-5 cursor-pointer text-gray-700" />
        <div className="flex flex-grow items-center">
          <div className="cursor-pointer font-medium text-gray-700">
            {selectedDate ? formatDate(selectedDate) : placeholder}
          </div>
          <input
            ref={dateInputRef}
            type="date"
            className="absolute h-0 w-0 opacity-0"
            value={selectedDate ? selectedDate.toISOString().split("T")[0] : ""}
            onChange={handleDateChange}
          />
        </div>
        {selectedDate && (
          <button
            onClick={handleClear}
            className="ml-2 text-gray-500 transition-colors hover:text-gray-700"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
