import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenMaintainer",
  description:
    "An AI-native workbench for open-source maintainers to triage issues, review pull requests, and draft releases.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
