import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LogMyPlate Admin",
  description: "Operational admin for LogMyPlate.",
  icons: {
    icon: "/icon.png",
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
