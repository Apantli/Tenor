"use client";

import { cn } from "~/lib/helpers/utils";
import React, { useState, useRef, useEffect, useContext } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import AIIcon from "@mui/icons-material/AutoAwesome";
import CloseIcon from "@mui/icons-material/Close";
import PrimaryButton from "../buttons/PrimaryButton";
import SendIcon from "@mui/icons-material/Send";
import { useFirebaseAuth } from "~/app/_hooks/useFirebaseAuth";
import { api } from "~/trpc/react";
import type { AIMessage } from "~/lib/types/firebaseSchemas";
import { useAlert } from "~/app/_hooks/useAlert";
import Dropdown, { DropdownItem, useCloseDropdown } from "../../Dropdown";
import ProfilePicture from "../../ProfilePicture";
import DeleteButton from "../buttons/DeleteButton";
import { PageContext } from "~/app/_hooks/usePageContext";

export interface Props {
  label?: string | React.ReactNode;
  labelClassName?: string;
  containerClassName?: string;
  disableAI?: boolean;
  aiTitle?: string;
  isTextArea?: boolean;
  id?: string;
  value?: string;
  onChange?: (
    e: ChangeEvent<HTMLTextAreaElement> | ChangeEvent<HTMLInputElement>,
  ) => void;
  className?: string;
  disablePlaceholder?: boolean;
  ref?: React.Ref<HTMLTextAreaElement | HTMLInputElement>;
  chatPlacement?: "top" | "bottom" | "left" | "right";
  resize?: boolean;
}

export default function InputField({
  label,
  id,
  labelClassName,
  containerClassName,
  className,
  disableAI,
  aiTitle,
  value,
  isTextArea,
  onChange,
  placeholder,
  disablePlaceholder,
  ref,
  chatPlacement,
  disabled = false,
  resize = true,
  ...props
}: Props &
  (
    | React.InputHTMLAttributes<HTMLTextAreaElement>
    | React.InputHTMLAttributes<HTMLInputElement>
  )) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const { user } = useFirebaseAuth();
  const [close, setClose] = useCloseDropdown();
  const dropdownButtonRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownInputRef = useRef<HTMLInputElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const pageContext = useContext(PageContext);

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to the bottom of the messages container
    const timeout = setTimeout(() => {
      if (!messagesContainerRef.current) return;
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }, 100);

    return () => clearTimeout(timeout);
  }, [messages]);

  const originalMessageRef = useRef<string>(value ?? "");

  const { mutateAsync: generateAutocompletion, status } =
    api.ai.generateAutocompletion.useMutation();

  const handleKeyDown = (
    e: KeyboardEvent<HTMLTextAreaElement> | KeyboardEvent<HTMLInputElement>,
  ) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      if (!isDropdownOpen) {
        setIsDropdownOpen(true);
        dropdownButtonRef.current?.click();
      } else {
        setIsDropdownOpen(false);
        setClose();
        if (isTextArea) {
          textareaRef.current?.focus();
        } else {
          inputRef.current?.focus();
        }
      }
    }
  };

  const updateInputValue = (newValue: string) => {
    if (onChange) {
      if (isTextArea && textareaRef.current) {
        const element = textareaRef.current;
        element.value = newValue;

        const syntheticEvent = {
          target: element,
          currentTarget: element,
          preventDefault: () => {},
          stopPropagation: () => {},
        } as unknown as ChangeEvent<HTMLTextAreaElement>;

        onChange(syntheticEvent);
      } else if (!isTextArea && inputRef.current) {
        const element = inputRef.current;
        element.value = newValue;

        const syntheticEvent = {
          target: element,
          currentTarget: element,
          preventDefault: () => {},
          stopPropagation: () => {},
        } as unknown as ChangeEvent<HTMLInputElement>;

        onChange(syntheticEvent);
      }
    }
  };
  const { predefinedAlerts } = useAlert();

  useEffect(() => {
    if (isDropdownOpen && messages.length === 0) {
      originalMessageRef.current = value ?? "";
    }
  }, [isDropdownOpen, value, messages.length]);

  useEffect(() => {
    const generateResponse = async () => {
      if (
        messages.length < 1 ||
        messages[messages.length - 1]?.role !== "user" ||
        status === "pending"
      )
        return;

      const generatedData = await generateAutocompletion({
        messages,
        relatedContext: {
          ...pageContext,
          "value in field": value,
          username: user?.displayName,
          email: user?.email,
        },
      });
      setMessages((prev) => [
        ...prev,
        {
          content: generatedData.autocompletion,
          role: "assistant",
          explanation: generatedData.assistant_message,
        },
      ]);
      updateInputValue(generatedData.autocompletion);
    };

    void generateResponse();
  }, [messages, generateAutocompletion, value, user]);

  const handleSendMessage = async () => {
    if (currentMessage.length > 0) {
      setMessages((prev) => [
        ...prev,
        { content: currentMessage, role: "user" },
      ]);
      setCurrentMessage("");
    }
  };

  // If the input is disabled, also disable AI popup
  disableAI = disabled ? disabled : disableAI;

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
      {disableAI && isTextArea && (
        <textarea
          id={id}
          html-rows="4"
          placeholder={placeholder}
          className={cn(
            "block min-h-40 w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:border-blue-500 focus:outline-none",
            resize ? "resize-y" : "resize-none",
            className,
          )}
          ref={ref ? (ref as React.Ref<HTMLTextAreaElement>) : null}
          value={value}
          onChange={onChange as React.ChangeEventHandler<HTMLTextAreaElement>}
          disabled={disabled}
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      )}
      {disableAI && !isTextArea && (
        <input
          id={id}
          placeholder={placeholder}
          className={cn(
            "inline-block w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm outline-none focus:border-blue-500",
            className,
          )}
          ref={ref ? (ref as React.Ref<HTMLInputElement>) : null}
          value={value}
          onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
          disabled={disabled}
          {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
        />
      )}

      {!disableAI && (
        <div className="group relative inline-block">
          {isTextArea && (
            <textarea
              id={id}
              html-rows="4"
              placeholder={
                placeholder +
                (isFocused && !disablePlaceholder
                  ? " Press Ctrl/⌘ + K to generate with AI."
                  : "")
              }
              onFocus={() => {
                setIsFocused(true);
              }}
              onBlur={() => {
                setIsFocused(false);
              }}
              className={cn(
                "block min-h-40 w-full rounded-md border border-gray-300 px-4 py-2 pr-9 shadow-sm focus:border-blue-500 focus:outline-none",
                resize ? "resize-y" : "resize-none",

                className,
              )}
              ref={textareaRef}
              value={value}
              onChange={
                onChange as React.ChangeEventHandler<HTMLTextAreaElement>
              }
              onKeyDown={
                handleKeyDown as React.KeyboardEventHandler<HTMLTextAreaElement>
              }
              disabled={disabled}
              {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
            />
          )}
          {!isTextArea && (
            <input
              id={id}
              placeholder={
                placeholder +
                (isFocused && !disablePlaceholder
                  ? " Press Ctrl/⌘ + K to generate with AI."
                  : "")
              }
              onFocus={() => {
                setIsFocused(true);
              }}
              onBlur={() => {
                setIsFocused(false);
              }}
              className={cn(
                "block w-full rounded-md border border-gray-300 px-4 py-2 pr-10 shadow-sm outline-none focus:border-blue-500",
                className,
              )}
              ref={inputRef}
              value={value}
              onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
              onKeyDown={
                handleKeyDown as React.KeyboardEventHandler<HTMLInputElement>
              }
              disabled={disabled}
              {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
            />
          )}
          <div className={cn("absolute bottom-2 right-2")}>
            <Dropdown
              allowMove
              uniqueKey={id}
              place={chatPlacement ?? "bottom"}
              label={
                <div
                  ref={dropdownButtonRef}
                  className={cn(
                    "opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100",
                    {
                      "opacity-100": isDropdownOpen,
                    },
                  )}
                >
                  <span
                    data-tooltip-html={
                      "<div style='display: flex; flex-direction: column; gap: 2px; align-items: center'><p><strong>Generate with AI</strong></p><p style='margin-left: auto; margin-right: auto'>Ctrl/⌘ K</p></div>"
                    }
                    data-tooltip-id="tooltip"
                  >
                    <AIIcon className="text-gray-500 hover:text-app-primary" />
                  </span>
                </div>
              }
              close={close}
              onOpen={() => {
                setIsDropdownOpen(true);
                dropdownInputRef.current?.focus();
              }}
              onClose={() => {
                setIsDropdownOpen(false);
              }}
            >
              <DropdownItem className="px-0 pt-0">
                <div
                  className="flex h-80 w-[343px] flex-col"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <div className="border-b-2">
                    <div className="flex flex-row items-center gap-4 px-3 py-2">
                      <AIIcon className="text-app-primary" />
                      <h3 className="text-lg font-bold">{aiTitle ?? label}</h3>
                      <CloseIcon
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setClose();
                        }}
                        fontSize="medium"
                        className="ml-auto cursor-pointer text-gray-500"
                      />
                    </div>
                  </div>
                  <div
                    className="flex max-h-48 flex-col overflow-y-auto px-4"
                    ref={messagesContainerRef}
                  >
                    {messages.length > 0 ? (
                      <div className="flex flex-col justify-start">
                        {messages.map((message, index) => (
                          <div
                            key={index}
                            className="flex flex-row items-center gap-2 border-b-2 px-1 py-2"
                          >
                            <ProfilePicture
                              user={
                                message.role == "user"
                                  ? user
                                  : {
                                      displayName: "Frida AI",
                                      uid: "129293", // Fake UID but gives a nice color
                                    }
                              }
                            />
                            <p className="no-scrollbar max-w-[450px] overflow-x-auto whitespace-normal text-sm">
                              {message.explanation ?? message.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 whitespace-normal text-sm text-gray-500">
                        No messages yet. Type something to get started.
                      </p>
                    )}
                    {status === "pending" && (
                      <div className="flex flex-row items-center gap-2 border-b-2 px-1 py-2">
                        <ProfilePicture
                          user={{
                            displayName: "Frida AI",
                            uid: "129293", // Fake UID but gives a nice color
                          }}
                        />
                        <p className="no-scrollbar max-w-[450px] animate-pulse overflow-x-auto whitespace-normal text-sm opacity-50">
                          Generating...
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="mt-auto px-4">
                    <div className="flex flex-col gap-2">
                      <div className="relative inline-block">
                        <input
                          type="text"
                          className="block w-full rounded-md border border-gray-300 px-4 py-2 pr-10 shadow-sm outline-none focus:border-blue-500"
                          placeholder={"What is in your mind?"}
                          value={currentMessage}
                          onChange={(e) => setCurrentMessage(e.target.value)}
                          ref={dropdownInputRef}
                          onKeyDown={async (e) => {
                            if (e.key === "Enter") {
                              if (status === "pending") {
                                predefinedAlerts.completionWarning();
                              } else {
                                e.preventDefault();
                                await handleSendMessage();
                              }
                            }
                            handleKeyDown(e);
                          }}
                        />
                        <div className="absolute bottom-2 right-2">
                          <SendIcon
                            className="text-gray-500 hover:cursor-pointer"
                            onClick={async () => {
                              if (status === "pending") {
                                predefinedAlerts.completionWarning();
                              } else {
                                await handleSendMessage();
                              }
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex flex-row items-center gap-2">
                        <DeleteButton
                          removeDeleteIcon
                          onClick={() => {
                            updateInputValue(originalMessageRef.current);
                            setIsDropdownOpen(false);
                            setMessages([]);
                            setCurrentMessage("");
                            setClose();
                          }}
                          disabled={
                            status === "pending" ||
                            originalMessageRef.current === value
                          }
                        >
                          Reject Changes
                        </DeleteButton>
                        <PrimaryButton
                          className=""
                          onClick={() => {
                            const filteredMessages = messages.filter(
                              (msg) => msg.role == "assistant",
                            );
                            const valueToUse =
                              filteredMessages.length > 0
                                ? filteredMessages[filteredMessages.length - 1]
                                : null;

                            if (valueToUse) {
                              updateInputValue(valueToUse.content);
                              originalMessageRef.current = valueToUse.content;
                              setMessages([]);
                              setIsDropdownOpen(false);
                              setClose();
                              setCurrentMessage("");
                            }
                          }}
                          disabled={
                            status === "pending" ||
                            originalMessageRef.current === value
                          }
                        >
                          Accept Changes
                        </PrimaryButton>
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
