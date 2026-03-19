import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PassdownPro — Shift Report Management",
  description: "Structured digital shift reports for manufacturing plant supervisors.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
