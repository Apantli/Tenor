import React, { useState } from "react";
import { cn } from "~/lib/utils";
import AIIcon from "@mui/icons-material/AutoAwesome";
import CloseIcon from "@mui/icons-material/Close";

interface Props {
  label?: string;
  labelClassName?: string;
  containerClassName?: string;
  title: string;
}
import Dropdown, { DropdownButton, DropdownItem } from "../Dropdown";

export default function AIInputText({
  label,
  id,
  labelClassName,
  containerClassName,
  className,
  title,
  ...props
}: Props & React.InputHTMLAttributes<HTMLInputElement>) {
  const [messages, setMessages] = useState<string[]>([]);

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
      <div className="relative inline-block">
        <input
          id={id}
          className={cn(
            "block w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm outline-none focus:border-blue-500",
            className,
          )}
          {...props}
        />
        <div className="absolute bottom-2 right-2">
          <Dropdown
            label={<AIIcon className="text-gray-500 hover:text-app-primary" />}
            className=""
          >
            <DropdownItem>
              <div className="flex flex-col gap-2">
                <div className="flex flex-row items-center gap-4 border-b-2 py-4">
                  <AIIcon className="text-gray-500" />
                  <h3 className="text-2xl font-bold">{title}</h3>
                  <CloseIcon fontSize="medium" className="text-gray-500" />
                </div>
                {messages.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className="flex flex-row items-center gap-2 rounded-md border-2 border-gray-300 p-2"
                      >
                        <p className="text-sm">{message}</p>
                        <CloseIcon
                          fontSize="small"
                          className="text-gray-500 hover:cursor-pointer"
                          onClick={() => {
                            setMessages((prev) =>
                              prev.filter((_, i) => i !== index),
                            );
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No messages yet. Type something to get started.
                  </p>
                )}
                <input
                  type="text"
                  className="block w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm outline-none focus:border-blue-500"
                  placeholder="Type a message..."
                />
              </div>
            </DropdownItem>
          </Dropdown>
        </div>
      </div>
    </div>
  );
}
