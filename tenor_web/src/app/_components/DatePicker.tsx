"use client";

import React, { useRef } from "react";
import { cn } from "~/lib/utils";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CloseIcon from "@mui/icons-material/Close";

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
  const dateInputRef = useRef<HTMLInputElement>(null);

  const formatDate = (date: Date): string => {
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
    if (assignDataAt === "beginOfDay") {
      const newDate = new Date(`${e.target.value}T00:00:00`);
      onChange(newDate);
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
    if (!disabled && dateInputRef.current) {
      dateInputRef.current.showPicker();
    }
  };

  return (
    <div
      data-cy="datepicker"
      className={cn("relative", className)}
      onClick={openDatePicker}
    >
      <div
        className={cn(
          "flex h-12 items-center justify-between rounded-lg border border-gray-300 p-2 transition-colors",
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
          <input
            disabled={disabled}
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
            {!disabled && <CloseIcon className="h-5 w-5" />}
          </button>
        )}
      </div>
    </div>
  );
}
