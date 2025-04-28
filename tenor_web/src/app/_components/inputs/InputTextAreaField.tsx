import { cn } from "~/lib/utils";
import React, { useState, useRef } from "react";
import AIIcon from "@mui/icons-material/AutoAwesome";
import CloseIcon from "@mui/icons-material/Close";
import Dropdown, { DropdownItem, useCloseDropdown } from "../Dropdown";
import PrimaryButton from "../buttons/PrimaryButton";
import DeleteButton from "~/app/_components/buttons/DeleteButton";
import SendIcon from "@mui/icons-material/Send";
import { useFirebaseAuth } from "~/app/_hooks/useFirebaseAuth";
import ProfilePicture from "../ProfilePicture";

interface Props {
  label?: string;
  labelClassName?: string;
  containerClassName?: string;
  disableAI?: boolean;
  aiTitle?: string;
}

export default function InputTextAreaField({
  label,
  id,
  labelClassName,
  containerClassName,
  className,
  disableAI,
  aiTitle,
  value,
  onChange,
  ...props
}: Props & React.InputHTMLAttributes<HTMLTextAreaElement>) {
  const [messages, setMessages] = useState<string[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const { user } = useFirebaseAuth();
  const [close, setClose] = useCloseDropdown();
  const dropdownButtonRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dropdownInputRef = useRef<HTMLInputElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleKeyDown = (
    e:
      | React.KeyboardEvent<HTMLTextAreaElement>
      | React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.ctrlKey && e.key === "k") {
      e.preventDefault();
      dropdownButtonRef.current?.click();
    }
  };

  const updateInputValue = (newValue: string) => {
    if (inputRef.current && onChange) {
      inputRef.current.value = newValue;

      const syntheticEvent = {
        target: inputRef.current,
        currentTarget: inputRef.current,
        preventDefault: () => {},
        stopPropagation: () => {},
      } as unknown as React.ChangeEvent<HTMLTextAreaElement>;
      onChange(syntheticEvent);
    }
  };

  return (
    <div className={cn("flex w-full flex-col gap-1", containerClassName)}>
      {label && (
        <label
          htmlFor={id}
          className={cn("text-sm font-semibold", labelClassName)}
        >
          {label}
        </label>
      )}
      {disableAI && (
        <textarea
          id={id}
          html-rows="4"
          className={cn(
            "block min-h-40 w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:border-blue-500 focus:outline-none",
            className,
          )}
          value={value}
          onChange={onChange}
          {...props}
        />
      )}

      {!disableAI && (
        <div className="group relative inline-block">
          <textarea
            id={id}
            html-rows="4"
            className={cn(
              "block min-h-40 w-full rounded-md border border-gray-300 px-4 py-2 pr-9 shadow-sm focus:border-blue-500 focus:outline-none",
              className,
            )}
            ref={inputRef}
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            {...props}
          />
          <div
            className={cn(
              "absolute bottom-2 right-2 opacity-0 transition-opacity duration-200",
              "group-focus-within:opacity-100",
              { "opacity-100": isDropdownOpen },
            )}
          >
            <Dropdown
              label={
                <div ref={dropdownButtonRef}>
                  <span
                    title="Generate with AI"
                    className="flex flex-col items-center text-gray-500 hover:text-blue-500"
                    data-tooltip-id="tooltip"
                  >
                    <AIIcon className="text-gray-500 hover:text-app-primary" />
                  </span>
                </div>
              }
              className=""
              close={close}
              onOpen={() => {
                setIsDropdownOpen(true);
                dropdownInputRef.current?.focus();
              }}
            >
              <DropdownItem className="px-0">
                <div
                  className="flex h-80 w-[500px] flex-col"
                  onClick={(e) => {
                    // Prevent the dropdown from closing when clicking inside
                    e.stopPropagation();
                  }}
                >
                  <div className="border-b-2">
                    <div className="flex flex-row items-center gap-4 px-3 py-4">
                      <AIIcon className="text-gray-500" />
                      <h3 className="text-2xl font-bold">{aiTitle ?? label}</h3>
                      <CloseIcon
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setClose();
                        }}
                        fontSize="medium"
                        className="ml-auto text-gray-500"
                      />
                    </div>
                  </div>
                  <div className="flex max-h-48 flex-col overflow-y-auto px-4">
                    {messages.length > 0 ? (
                      <div className="flex flex-col">
                        {messages.map((message, index) => (
                          <div
                            key={index}
                            className="flex flex-row items-center gap-2 border-b-2 px-1 py-2"
                          >
                            <ProfilePicture user={user} hideTooltip />
                            <p className="no-scrollbar max-w-[450px] overflow-x-auto text-sm">
                              {message}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-gray-500">
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
                          placeholder="What is in your mind?"
                          value={currentMessage}
                          onChange={(e) => setCurrentMessage(e.target.value)}
                          ref={dropdownInputRef}
                          onKeyDown={handleKeyDown}
                        />
                        <div className="absolute bottom-2 right-2">
                          <SendIcon
                            className="text-gray-500 hover:cursor-pointer"
                            onClick={() => {
                              if (currentMessage.length > 0) {
                                setMessages((prev) => [
                                  ...prev,
                                  currentMessage,
                                ]);
                                setCurrentMessage("");
                              }
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex flex-row items-center gap-2">
                        <PrimaryButton
                          className=""
                          onClick={() => {
                            const valueToUse =
                              currentMessage.length > 0
                                ? currentMessage
                                : messages.length > 0
                                  ? messages[messages.length - 1]
                                  : "";

                            if (valueToUse) {
                              updateInputValue(valueToUse);
                              setClose();
                              setCurrentMessage("");
                            }
                          }}
                        >
                          {currentMessage.length > 0 ? "Generate" : "Accept"}
                        </PrimaryButton>
                        <DeleteButton
                          onClick={() => {
                            setClose();
                          }}
                        >
                          Close
                        </DeleteButton>
                      </div>
                    </div>
                  </div>
                </div>
              </DropdownItem>
            </Dropdown>
          </div>
        </div>
      )}
    </div>
  );
}
