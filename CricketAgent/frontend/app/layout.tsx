import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cricket AI — Stats & Records",
  description: "AI-powered cricket stats assistant. Ask anything about Test, ODI, and T20 cricket.",
  themeColor: "#0a0f0a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="bg-[#f0fdf4] text-slate-800 min-h-screen overflow-hidden">
        {children}
      </body>
    </html>
  );
}
