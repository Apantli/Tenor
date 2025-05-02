import React, { useRef } from "react";
import type { ClassNameValue } from "tailwind-merge";
import { cn } from "~/lib/utils";
import InsertLinkIcon from "@mui/icons-material/InsertLink";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import PrimaryButton from "../buttons/PrimaryButton";
import Dropdown, { DropdownButton, DropdownItem } from "../Dropdown";
import InputTextField from "./InputTextField";
import useConfirmation from "~/app/_hooks/useConfirmation";
import CloseIcon from "@mui/icons-material/Cancel";

import { type Links } from "~/server/api/routers/settings";

interface Props {
  label: string;
  links: Links[];
  handleLinkAdd: (link: Links) => void;
  handleLinkRemove: (link: Links) => void;
  className?: ClassNameValue;
}

// FIXME: We need to improve a type checking for the links. You can just input "hey" and it will be added as a link
export default function LinkList({
  label,
  className,
  handleLinkAdd,
  handleLinkRemove,
  links,
}: Props) {
  const [link, setLink] = React.useState("");
  const confirm = useConfirmation();
  const insertLinkRef = useRef<HTMLInputElement>(null);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-4">
        <label className="text-lg font-semibold">{label}</label>
        <Dropdown
          label={
            <PrimaryButton
              asSpan // Needed because the dropdown label is automatically a button and we can't nest buttons
              className="flex max-h-[40px] items-center"
              onClick={() => {
                if (insertLinkRef.current) {
                  insertLinkRef.current.focus();
                }
              }}
            >
              Add Context Link +
            </PrimaryButton>
          }
        >
          <DropdownItem>
            <InputTextField
              ref={insertLinkRef}
              placeholder="https://example.com"
              value={link}
              onChange={(e) => {
                setLink(e.target.value);
              }}
              disableAI
            />
          </DropdownItem>

          <DropdownButton
            className="flex items-center justify-between"
            onClick={() => {
              if (link.trim()) {
                handleLinkAdd({ url: link.trim(), valid: true });
                setLink("");
              }
            }}
          >
            <span>Add Link</span>
          </DropdownButton>
        </Dropdown>
      </div>
      <ul
        className={cn(
          "flex h-[100px] w-full list-none gap-4 overflow-x-auto overflow-y-hidden rounded-md border border-gray-300 px-4 py-2 shadow-sm",
          className,
        )}
      >
        {links.length === 0 && (
          <li className="flex h-full w-full text-gray-400">
            No links added yet...
          </li>
        )}
        {links.map((link, index) => (
          <li
            key={index}
            className="h-[100px] flex-shrink-0"
            title={link.url}
            onClick={async () => {
              if (
                !(await confirm(
                  "Delete link?",
                  `Removing "${link.url}". This action is not reversible.`,
                  "Delete link",
                ))
              ) {
                return;
              }
              handleLinkRemove({ url: link.url, valid: link.valid });
            }}
          >
            <span
              title={link.url}
              className="group relative flex cursor-pointer flex-col items-center text-gray-500 transition hover:text-gray-500/50"
              data-tooltip-id="tooltip"
              data-tooltip-content={link.url}
            >
              <div className="absolute left-0 top-0 flex h-full w-full items-center justify-center pb-4 text-[40px] text-app-fail/90 opacity-0 transition group-hover:opacity-100">
                <CloseIcon fontSize="inherit" />
              </div>
              {link.valid ? (
                <InsertLinkIcon style={{ fontSize: "4rem" }} />
              ) : (
                <LinkOffIcon style={{ fontSize: "4rem" }} />
              )}
              <span className="mt-1 max-w-[80px] truncate text-center text-xs">
                {
                  // remove the protocol from the link
                  link.url.replace(/^(http:\/\/|https:\/\/)/, "")
                }
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
