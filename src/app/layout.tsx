import type { Metadata } from "next";
import { Cinzel, Inter } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "THE LENS | A Cinematic Storytelling Experience",
  description: "An immersive, scroll-driven 3D journey through light, focus, memory, and legacy, inspired by Oryzo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${inter.variable} bg-black text-white h-full antialiased selection:bg-amber-500/30 selection:text-amber-200`}
    >
      <body className="min-h-full bg-black text-white overflow-x-hidden font-sans">
        {children}
      </body>
    </html>
  );
}
