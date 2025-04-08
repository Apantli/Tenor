import React from "react";
import { cn } from "~/lib/utils";

interface Props {
  label?: string;
  labelClassName?: string;
  containerClassName?: string;
}

export default function InputTextAreaField({
  label,
  className,
  containerClassName,
  labelClassName,
  id,
  ...props
}: Props & React.InputHTMLAttributes<HTMLTextAreaElement>) {
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
      <textarea
        id={id}
        html-rows="4"
        className={cn(
          "block w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:border-blue-500 focus:outline-none",
          className,
        )}
        {...props}
      ></textarea>
    </div>
  );
}
