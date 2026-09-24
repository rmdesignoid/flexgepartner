import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flexge - Teacher Dashboard",
  description: "Schedule and manage upcoming classes in a focused weekly planner.",
  icons: { icon: "/flexge-mark.svg", shortcut: "/flexge-mark.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
