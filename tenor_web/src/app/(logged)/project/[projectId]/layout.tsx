import Link from "next/link";
import React, { type PropsWithChildren } from "react";
import Navbar from "~/app/_components/Navbar";
import Tabbar from "~/app/_components/Tabbar";

export default function ProjectLayout({ children }: PropsWithChildren) {
  return (
    <div>
      <Navbar>
        <div className="flex gap-1">
          <Link href="/" className="font-semibold">
            Projects
          </Link>
          <span>/ ProjectName</span>
        </div>
      </Navbar>
      <Tabbar />
      <main className="m-6 p-4">{children}</main>
    </div>
  );
}
