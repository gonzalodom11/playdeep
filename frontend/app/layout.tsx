import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../index.css";
import Footer from "@/components/footer/Footer";
import Navbar from "@/components/header/Navbar";
import {ClientQueryProvider} from "@/providers/client-query-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PlayDeep ML",
  description: "Play Deep Machine Learning Platform for Football Analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClientQueryProvider>
        <div className="min-h-screen flex flex-col navbar-dark">
          <Navbar />
            <main className="flex-grow mt-16 bg-football-dark">{children}</main>
          <Footer />
        </div>
        </ClientQueryProvider>

      </body>
    </html>
  );
}
  