import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/app/components/Navigation";
import { Toaster } from "sonner";
import { Rubik } from 'next/font/google'
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Flight Booking - PWA",
  description: "Book your flights online - Progressive Web App",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Flight Booking",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

const rubik = Rubik({
  subsets: ['latin'],
  weight: ['400', '600'], // reduce weights to minimize font payload
  variable: '--font-rubik', // CSS variable for Tailwind
  display: 'swap',
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${rubik.variable} h-full antialiased`}
    >
      <head>
        <meta name="theme-color" content="#2563eb" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Flight Booking" />
      </head>
      <body className="min-h-full flex flex-col bg-gray-50">
        <Navigation />
        <main className="flex-1 w-full">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
