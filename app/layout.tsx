import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Business Idea Validator",
  description: "AI-powered business idea analysis and validation",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
