import "~/styles/globals.css";

import Navbar from "../_components/Navbar";
import ClientAuthBoundary from "../_components/ClientAuthBoundary";

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClientAuthBoundary>
      <Navbar />
      <main className="m-6 p-4">{children}</main>
    </ClientAuthBoundary>
  );
}
