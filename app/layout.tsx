import type { Metadata } from "next";

import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { ChatWidget } from "@/components/chat/chat-widget";
import { AuthProvider } from "@/components/providers/auth-context-provider";
import { BriefSelectionProvider } from "@/components/providers/brief-selection-provider";
import ReactQueryProvider from "@/components/providers/react-query-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Crypto Intelligence Platform",
  description: "AI-powered crypto and blockchain intelligence platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark`}
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        <ReactQueryProvider>
          <AuthProvider>
            <BriefSelectionProvider>
              <div className="min-h-screen bg-background text-foreground">
                <Navbar />

                <div className="flex">
                  {/* <Sidebar /> */}

                  <main className="min-w-0 flex-1 p-6">{children}</main>
                </div>
              </div>

              <ChatWidget />
            </BriefSelectionProvider>
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}