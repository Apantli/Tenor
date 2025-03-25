import React, { PropsWithChildren } from "react";
import Navbar from "~/app/_components/Navbar";
import Tabbar from "~/app/_components/Tabbar";

export default function ProjectLayout({ children }: PropsWithChildren) {
  return (
    <div>
      <Navbar />
      <Tabbar />
      <main className="m-6 p-4">{children}</main>
    </div>
  );
}
