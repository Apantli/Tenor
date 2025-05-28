import "~/styles/globals.css";

import Navbar from "../../_components/Navbar";
import Link from "next/link";

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Navbar>
        <Link href="/" className="font-semibold">
          Profile
        </Link>
      </Navbar>
      <main className="m-6 p-4">{children}</main>
    </>
  );
}
