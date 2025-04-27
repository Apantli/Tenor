import React, { useState } from "react";
import { cn } from "~/lib/utils";
import { HexAlphaColorPicker, HexColorInput } from "react-colorful";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import Dropdown, { DropdownItem } from "../Dropdown";

interface Props {
  label?: string;
  labelClassName?: string;
  containerClassName?: string;
  value: string;
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
      <Dropdown
        label={
          <>
            <div className="mt-1 flex items-center gap-2">
              <div
                className="h-6 w-6 rounded-md"
                style={{ backgroundColor: value }}
              />
              <span>{value}</span>
              <ArrowDropDownIcon className="ml-auto" />
            </div>
          </>
        }
        className={cn(
          "block w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm outline-none focus:border-blue-500",
          className,
        )}
        {...props}
      >
        <DropdownItem>
          <>
            <HexAlphaColorPicker
              color={value}
              onChange={(color) => onChange(color.toUpperCase())}
              className="custom-layout"
            />
            <style jsx global>{`
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
            alpha={true}
          />
        </DropdownItem>
      </Dropdown>
    </div>
  );
}
