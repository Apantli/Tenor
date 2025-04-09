import React from "react";
import { cn } from "~/lib/utils";

interface Props {
  label?: string;
  labelClassName?: string;
  containerClassName?: string;
}

export default function InputTextField({
  label,
  id,
  labelClassName,
  containerClassName,
  className,
  ...props
}: Props & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn("w-full", containerClassName)}>
      {label && (
        <label
          htmlFor={id}
          className={cn("text-sm font-semibold", labelClassName)}
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          "block w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm outline-none focus:border-blue-500",
          className,
        )}
        {...props}
      />
    </div>
  );
}
