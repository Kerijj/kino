import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "КИНО АРХИВ",
  description: "Vintage Movie Portfolio",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,900;1,900&family=Courier+Prime&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
