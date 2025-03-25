import "~/styles/globals.css";

import Navbar from "../../_components/Navbar";

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Navbar />
      <main className="m-6 p-4">{children}</main>
    </>
  );
}
