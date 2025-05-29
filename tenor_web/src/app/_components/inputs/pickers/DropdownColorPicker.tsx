import React from "react";
import { cn } from "~/lib/helpers/utils";
import { HexColorInput, HexColorPicker } from "react-colorful";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import Dropdown, { DropdownItem } from "../../Dropdown";

interface Props {
  label?: string;
  labelClassName?: string;
  containerClassName?: string;
  value: string;
  disabled?: boolean;
  onChange: (color: string) => void;
}

export default function DropdownColorPicker({
  label,
  id,
  labelClassName,
  containerClassName,
  value,
  onChange,
  className,
  disabled = false,
  ...props
}: Props &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <div className={cn("w-full", containerClassName)} id={id}>
      {label && (
        <label
          htmlFor={id}
          className={cn("text-sm font-semibold", labelClassName)}
        >
          {label}
        </label>
      )}
      {disabled ? (
        <div
          className={cn(
            "block w-full rounded-md border border-gray-300 px-4 py-2",
            "cursor-not-allowed bg-gray-50",
            className,
          )}
        >
          <div className="mt-1 flex items-center gap-2">
            <div
              className="h-6 w-6 rounded-md"
              style={{ backgroundColor: value }}
            />
            <span className="text-gray-500">{value}</span>
          </div>
        </div>
      ) : (
        <Dropdown
          label={
            <div
              className={cn(
                "block w-full rounded-md border border-gray-300 px-4 py-2 pb-3 shadow-sm outline-none focus:border-blue-500",
                className,
              )}
            >
              <div className="mt-1 flex items-center gap-2">
                <div
                  className="h-6 w-6 rounded-md"
                  style={{ backgroundColor: value }}
                />
                <span>{value}</span>
                <ArrowDropDownIcon className="ml-auto" />
              </div>
            </div>
          }
          {...props}
        >
          <DropdownItem>
            <>
              <HexColorPicker
                color={value}
                onChange={(color) => onChange(color.toUpperCase())}
                className="custom-layout"
              />
              <style>{`
              .custom-layout .react-colorful {
                padding: 16px;
                border-radius: 12px;
                background: #33333a;
                box-shadow: 0 6px 12px #999;
              }

              .custom-layout .react-colorful__saturation {
                margin: 5px 0;
                border-radius: 5px;
                border-bottom: none;
              }

              .custom-layout .react-colorful__hue,
              .custom-layout .react-colorful__alpha {
                height: 20px;
                border-radius: 10px;
              }

              .custom-layout .react-colorful__hue {
                margin: 5px 0;
              }
              .custom-layout .react-colorful__alpha {
                margin: 5px 0 0 0;
              }

              .custom-layout .react-colorful__hue-pointer,
              .custom-layout .react-colorful__alpha-pointer {
                width: 20px;
                height: 20px;
              }
            `}</style>
            </>
          </DropdownItem>
          <DropdownItem>
            <HexColorInput
              color={value}
              onChange={(color) => onChange(color)}
              prefixed={true}
              className="block w-[200px] rounded-md border border-gray-300 px-4 py-2 shadow-sm outline-none focus:border-blue-500"
            />
          </DropdownItem>
        </Dropdown>
      )}
    </div>
  );
}
