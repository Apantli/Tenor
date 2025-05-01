import React from "react";
import type { ClassNameValue } from "tailwind-merge";
import { cn } from "~/lib/utils";
import InsertLinkIcon from "@mui/icons-material/InsertLink";
import PrimaryButton from "../buttons/PrimaryButton";
import Dropdown, { DropdownButton, DropdownItem } from "../Dropdown";
import InputTextField from "./InputTextField";
import { useAlert } from "~/app/_hooks/useAlert";
import useConfirmation from "~/app/_hooks/useConfirmation";

interface Props {
  label: string;
  links: string[];
  handleLinkAdd: (link: string) => void;
  handleLinkRemove: (link: string) => void;
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
  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-4">
        <label className="font-semibold text-lg">{label}</label>
        <Dropdown
          label={
            <PrimaryButton
              asSpan // Needed because the dropdown label is automatically a button and we can't nest buttons
              className="flex max-h-[40px] items-center"
            >
              Add Context Link +
            </PrimaryButton>
          }
        >
          <DropdownItem>
            <InputTextField
              placeholder="https://example.com"
              value={link}
              onChange={(e) => {
                setLink(e.target.value);
              }}
              disableAI={true}
            />
          </DropdownItem>

          <DropdownButton
            className="flex items-center justify-between"
            onClick={() => {
              if (link.trim()) {
                handleLinkAdd(link.trim());
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
          <li className="flex h-full w-full text-gray-400 ">
            No links added yet...
          </li>
        )}
        {links.map((link, index) => (
          <li
            key={index}
            className="h-[100px] flex-shrink-0"
            title={link}
            onClick={async () => {
              if (
                !(await confirm(
                  "Delete link?",
                  `Removing "${link}". This action is not reversible.`,
                  "Delete link",
                ))
              ) {
                return;
              }
              handleLinkRemove(link);
            }}
          >
            <span
              title={link}
              className="flex flex-col items-center text-gray-500 hover:text-blue-500"
              data-tooltip-id="tooltip"
              data-tooltip-content={"Click to delete"}
            >
              <InsertLinkIcon style={{ fontSize: "4rem" }} />
              <span className="mt-1 max-w-[80px] truncate text-center text-xs">
                {
                  // remove the protocol from the link
                  link.replace(/^(http:\/\/|https:\/\/)/, "")
                }
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
