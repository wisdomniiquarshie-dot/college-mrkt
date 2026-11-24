import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { InstallAppPrompt } from "@/components/marketplace/install-app-prompt";
import { SiteHeader } from "@/components/marketplace/site-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "COLLEGE MRKT | Student marketplace",
  description: "Buy, sell and pass things on with students at ATU and campuses across Ghana.",
  applicationName: "COLLEGE MRKT",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "COLLEGE MRKT",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        {children}
        <InstallAppPrompt />
      </body>
    </html>
  );
}
