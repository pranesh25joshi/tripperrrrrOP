import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthInitializer from "./components/AuthInitializer";
import { Toaster } from "@/components/ui/sonner";
import Header from "./components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tripper",
  description: "Manage your trips and expenses with friends",
  icons: {
    icon: '/my-notion-face-transparent.svg',
    apple: '/my-notion-face-transparent.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthInitializer>
          <div className="min-h-screen flex flex-col">
            <Header />
            {children}
          </div>
          <Toaster richColors position="top-right" />
        </AuthInitializer>
      </body>
    </html>
  );
}
