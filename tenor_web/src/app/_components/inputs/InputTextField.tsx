import React from "react";
import { cn } from "~/lib/utils";

interface Props {
  label: string;
  
}

export default function InputTextField({ label, id, className, ...props }: Props & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="w-full max-w-md">
        <label htmlFor={id} className="text-sm font-semibold" >
        {label}
        </label>
        <input
        id={id}
        className={cn("block w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none", className)}
        {...props}
        />
    </div>
  );
}
