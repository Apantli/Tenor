import React from "react";
import { cn } from "~/lib/utils";

interface Props {
  label?: string;
}

export default function InputTextAreaField({
  label,
  className,
  ...props
}: Props & React.InputHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor="project-description" className="text-sm font-semibold">
          {label}
        </label>
      )}
      <textarea
        id="project-description"
        name="project-description"
        html-rows="4"
        className={cn(
          "block w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
          className,
        )}
        {...props}
      ></textarea>
    </div>
  );
}
