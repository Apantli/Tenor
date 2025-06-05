import React, { type KeyboardEventHandler } from "react";
import { type ClassNameValue } from "tailwind-merge";
import { cn } from "~/lib/helpers/utils";

interface Props {
  children: React.ReactNode;
  className?: ClassNameValue;
  error?: string;
  onSubmit?: () => void;
}

export default function FloatingLabelInput({
  children,
  error,
  className,
  onSubmit,
  onKeyDown,
  ...props
}: Props & React.InputHTMLAttributes<HTMLInputElement>) {
  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      onSubmit?.();
    }
    onKeyDown?.(e);
  };

  return (
    <div className="flex flex-col">
      <div className="relative w-full">
        <input
          className={cn(
            "peer w-full rounded-lg border border-app-border p-2 text-app-text outline-none",
            className,
            {
              "border-app-fail": !!error,
            },
          )}
          placeholder=""
          {...props}
          onKeyDown={onSubmit ? handleKeyDown : onKeyDown}
        />
        <label className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 transition-all peer-focus:top-0 peer-focus:bg-white peer-focus:text-sm peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:text-sm">
          {children}
        </label>
      </div>
      {error && <p className="text-app-fail">{error}</p>}
    </div>
  );
}
