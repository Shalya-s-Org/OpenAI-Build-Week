import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Meeting-to-Momentum", description: "Clarity after the meeting." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
