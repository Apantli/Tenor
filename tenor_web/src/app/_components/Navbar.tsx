"use client";

import Image from "next/image";
import Link from "next/link";
import WhiteLogo from "../_images/white_logo.png";
import { usePathname } from "next/navigation";
import { cn } from "~/lib/utils";

interface Props {
  tabs: {
    name: string;
    link: string;
  }[];
}

export default function Navbar({ tabs }: Props) {
  const pathname = usePathname();

  return (
    <nav className="bg-app-primary flex h-16 items-center px-2">
      <Image src={WhiteLogo} alt="Tenor Logo" className="h-7 w-auto" />
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
    </nav>
  );
}
