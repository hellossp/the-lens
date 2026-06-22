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
  title: "THE LENS STUDIO | Cinematic Photography & Art",
  description: "An immersive showcase of high-fidelity cinematic photography, capturing weddings, editorial portraits, brand keynotes, and commercial imagery.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${inter.variable} h-full antialiased selection:bg-amber-500/30 selection:text-amber-200`}
    >
      <body className="min-h-full overflow-x-hidden font-sans">
        {children}
      </body>
    </html>
  );
}
