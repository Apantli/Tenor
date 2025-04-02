import { Class } from "node_modules/superjson/dist/types";
import React from "react";
import { ClassNameValue } from "tailwind-merge";
import { cn } from "~/lib/utils";
import PrimaryButton from "../PrimaryButton";
import InsertLinkIcon from '@mui/icons-material/InsertLink';

interface Props {
  label: string;
  links: string[];
  handleLinkChange: (link: string) => void;
  className?: ClassNameValue;
}

export default function LinkList({ label, className, handleLinkChange, links , ...props }: Props) {
    const handleAddLinkClick = () => {
        const newLink = prompt("Enter the link:");
        if (newLink?.trim()) {
          handleLinkChange(newLink.trim());
        }
      };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center py-4">
                <label className="text-sm font-semibold" >
                {label}
                </label>
                < PrimaryButton 
                    className="text-sm font-semibold max-h-[40px]"
                    onClick={handleAddLinkClick}
                > Add Link + </PrimaryButton>
            </div>
            <ul
            className={cn(
                "h-[100px] flex gap-4 overflow-x-auto list-none w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm",
                className
            )}
            >
            {links.map((link, index) => (
                <li key={index} className="flex-shrink-0 h-[100px]" title={link}>
                <span
                title={link} 
                    className="flex flex-col items-center text-gray-500 hover:text-blue-500"
                >
                    <InsertLinkIcon style={{ fontSize: '4rem' }} />
                    <span className="text-xs mt-1 truncate max-w-[80px] text-center">
                    {link}
                    </span>
                </span>
                </li>
            ))}
            </ul>

        </div>
    );
}
