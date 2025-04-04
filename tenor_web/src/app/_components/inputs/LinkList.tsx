import { Class } from "node_modules/superjson/dist/types";
import React from "react";
import { ClassNameValue } from "tailwind-merge";
import { cn } from "~/lib/utils";
import InsertLinkIcon from "@mui/icons-material/InsertLink";
import PrimaryButton from "../buttons/PrimaryButton";
import Dropdown, { DropdownButton, DropdownItem } from "../Dropdown";
import InputTextField from "./InputTextField";

interface Props {
  label: string;
  links: string[];
  handleLinkAdd: (link: string) => void;
  handleLinkRemove: (link: string) => void;
  className?: ClassNameValue;
}

export default function LinkList({
  label,
  className,
  handleLinkAdd,
  handleLinkRemove,
  links,
}: Props) {
  const [link, setLink] = React.useState("");

  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-4">
        <label className="text-sm font-semibold">{label}</label>
        <Dropdown
          label={
            <PrimaryButton className="flex max-h-[40px] items-center text-sm font-semibold">
              {" "}
              Add Context Link +{" "}
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
          "flex h-[100px] w-full list-none gap-4 overflow-x-auto rounded-md border border-gray-300 px-4 py-2 shadow-sm",
          className,
        )}
      >
        {links.map((link, index) => (
          <li
            key={index}
            className="h-[100px] flex-shrink-0"
            title={link}
            onClick={() => {
              handleLinkRemove(link);
            }}
          >
            <span
              title={link}
              className="flex flex-col items-center text-gray-500 hover:text-blue-500"
              data-tooltip-id="tooltip"
              data-tooltip-content={link}
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
