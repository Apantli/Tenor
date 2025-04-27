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
import Dropdown, { DropdownItem, DropdownButton } from "../Dropdown";
import PrimaryButton from "../buttons/PrimaryButton";
import DeleteButton from "~/app/_components/buttons/DeleteButton";
import SendIcon from "@mui/icons-material/Send";

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
  const [currentMessage, setCurrentMessage] = useState<string>("");

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
            <DropdownItem className="px-0">
              <div className="flex h-72 w-[500px] flex-col gap-2">
                <div className="border-b-2">
                  <div className="flex flex-row items-center gap-4 px-3 py-4">
                    <AIIcon className="text-gray-500" />
                    <h3 className="text-2xl font-bold">{title}</h3>
                    <CloseIcon
                      fontSize="medium"
                      className="ml-auto text-gray-500"
                    />
                  </div>
                </div>
                <div className="flex max-h-48 flex-col gap-2 overflow-y-auto px-4 py-2">
                  {messages.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {messages.map((message, index) => (
                        <div
                          key={index}
                          className="flex flex-row items-center gap-2 border-b-2 p-2"
                        >
                          <p className="no-scrollbar max-w-[450px] overflow-x-auto text-sm">
                            {message}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No messages yet. Type something to get started.
                    </p>
                  )}
                </div>
                <div className="mt-auto px-4">
                  <div className="flex flex-col gap-2">
                    <div className="relative inline-block">
                      <input
                        type="text"
                        className="block w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm outline-none focus:border-blue-500"
                        placeholder="Write a message..."
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                      />
                      <div className="absolute bottom-2 right-2">
                        <SendIcon
                          className="text-gray-500 hover:cursor-pointer"
                          onClick={() => {
                            if (currentMessage.length > 0) {
                              setMessages((prev) => [...prev, currentMessage]);
                              setCurrentMessage("");
                            }
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex flex-row items-center gap-2">
                      <PrimaryButton>
                        {currentMessage.length > 0 ? "Generate" : "Accept"}
                      </PrimaryButton>
                      <DeleteButton>Close</DeleteButton>
                    </div>
                  </div>
                </div>
              </div>
            </DropdownItem>
          </Dropdown>
        </div>
      </div>
    </div>
  );
}
