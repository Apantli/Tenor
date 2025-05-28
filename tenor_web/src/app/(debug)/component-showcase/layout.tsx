import { redirect } from "next/navigation";
import { type PropsWithChildren } from "react";

export default function ComponentShowcaseLayout({
  children,
}: PropsWithChildren) {
  if (process.env.NODE_ENV !== "development") {
    redirect("/");
  }

  return children;
}
