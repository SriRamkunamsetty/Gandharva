import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Gandarva | AI Music Transcription",
  description: "Turn Sound Into Sheet Music",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="antialiased bg-background text-foreground selection:bg-primary/30">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
