import { Class } from "node_modules/superjson/dist/types";
import React from "react";
import { ClassNameValue } from "tailwind-merge";
import { cn } from "~/lib/utils";
import PrimaryButton from "../PrimaryButton";
import InsertLinkIcon from "@mui/icons-material/InsertLink";

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
  const handleAddLinkClick = () => {
    const newLink = prompt("Enter the link:");
    if (newLink?.trim()) {
      handleLinkAdd(newLink.trim());
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-4">
        <label className="text-sm font-semibold">{label}</label>
        <PrimaryButton
          className="max-h-[40px] text-sm font-semibold"
          onClick={handleAddLinkClick}
        >
          {" "}
          Add Context Link +{" "}
        </PrimaryButton>
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
            >
              <InsertLinkIcon
                style={{ fontSize: "4rem" }}
                data-tooltip-id="tooltip"
                data-tooltip-content={link}
              />
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
