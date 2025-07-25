import React, { useId } from "react";
import { cn } from "~/lib/helpers/utils";
import Dropdown, { DropdownButton } from "../Dropdown";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import InputTextField from "./text/InputTextField";

export type TimeFrame = "Days" | "Weeks";
export const timeframeMultiplier = {
  Days: 1,
  Weeks: 7,
} as Record<TimeFrame, number>;

interface Props {
  label?: string;
  labelClassName?: string;
  containerClassName?: string;
  timeNumber: number;
  timeFrame: TimeFrame;
  onTimeNumberChange: (value: number) => void;
  onTimeFrameChange: (value: TimeFrame) => void;
  disabled?: boolean;
}

export default function TimeMultiselect({
  label,
  labelClassName,
  containerClassName,
  timeNumber,
  timeFrame,
  onTimeNumberChange,
  onTimeFrameChange,
  disabled = false,
  ...props
}: Props & React.HTMLProps<HTMLDivElement>) {
  const id = useId();
  const timeframeOptions = ["Days", "Weeks"] as TimeFrame[];

  const handleTimeNumberChange = (value: string) => {
    if (value === "") {
      value = "0";
    }
    const parsedValue = parseInt(value, 10);
    if (!isNaN(parsedValue)) {
      onTimeNumberChange(parsedValue);
    }
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
          disabled={disabled}
          value={timeNumber}
          onChange={(e) => handleTimeNumberChange(e.target.value)}
          containerClassName="w-3/4"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          disableAI={true}
          {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
        />
        <Dropdown
          disabled={disabled}
          label={
            <div className="flex justify-start rounded-md border border-gray-300 px-4 py-2 shadow-sm outline-none focus:border-blue-500">
              {timeFrame}
              {!disabled && <ArrowDropDownIcon className="ml-auto" />}
            </div>
          }
          className="w-1/4"
        >
          {timeframeOptions.map((option, index) => (
            <DropdownButton
              key={index}
              onClick={() => onTimeFrameChange(option)}
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
