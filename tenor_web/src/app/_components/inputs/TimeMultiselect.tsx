import React, { useId, useState } from "react";
import { cn } from "~/lib/utils";
import Dropdown, { DropdownButton } from "../Dropdown";
import InputTextField from "./InputTextField";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

interface Props {
  label?: string;
  labelClassName?: string;
  containerClassName?: string;
  days: number;
  setDays: (days: number, timeframe: TimeFrame) => void;
}

export type TimeFrame = "Days" | "Weeks";
export const timeframeMultiplier = {
  Days: 1,
  Weeks: 7,
} as Record<TimeFrame, number>;

export default function TimeMultiselect({
  label,
  labelClassName,
  containerClassName,
  days,
  setDays,
}: Props) {
  const id = useId();
  const [timeframe, setTimeFrame] = useState<TimeFrame>("Days");
  const [internalDays, setInternalDays] = useState(days);

  const timeframeOptions = ["Days", "Weeks"] as TimeFrame[];

  const handleDaysChange = (value: string) => {
    if (value === "") {
      value = "0";
    }
    const parsedValue = parseInt(value, 10);
    if (!isNaN(parsedValue)) {
      setInternalDays(parsedValue);
      setDays(parsedValue, timeframe);
    }
  };

  const handleTimeframeChange = (value: string) => {
    setTimeFrame(value as TimeFrame);
    setDays(internalDays, value as TimeFrame);
  };

  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className={cn("text-sm font-semibold", labelClassName)}
        >
          {label}
        </label>
      )}
      <div id={id} className={cn("flex w-full gap-3", containerClassName)}>
        <InputTextField
          value={internalDays}
          onChange={(e) => handleDaysChange(e.target.value)}
          containerClassName="w-3/4"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
        />
        <Dropdown
          label={
            <div className="flex justify-start rounded-md border border-gray-300 px-4 py-2 shadow-sm outline-none focus:border-blue-500">
              {timeframe}
              <ArrowDropDownIcon className="ml-auto" />
            </div>
          }
          className="w-1/4"
        >
          {timeframeOptions.map((option, index) => (
            <DropdownButton
              key={index}
              onClick={() => handleTimeframeChange(option)}
              className="w-full px-5"
            >
              {option}
            </DropdownButton>
          ))}
        </Dropdown>
      </div>
    </div>
  );
}
