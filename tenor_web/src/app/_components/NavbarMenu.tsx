"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "~/lib/utils";

export interface NavbarMenuProps {
  tabs: {
    name: string;
    link: string;
  }[];
}

export default function NavbarMenu({ tabs }: NavbarMenuProps) {
  const pathname = usePathname();

  return (
    <div className="ml-2 flex items-center gap-2">
      {tabs.map((tab, i) => (
        <Link
          key={i}
          href={tab.link}
          className={cn("flex items-center p-2 text-white", {
            "text-app-primary rounded-md bg-white": pathname == tab.link,
          })}
        >
          {tab.name}
        </Link>
      ))}
    </div>
  );
}
