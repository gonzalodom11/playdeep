import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../index.css";
import Footer from "@/components/footer/Footer";
import Navbar from "@/components/header/Navbar";
import {ClientQueryProvider} from "@/providers/client-query-provider";
import { ToastProvider } from "@/components/ui/toast"; // Import toast components
import { Toaster } from "@/components/ui/Toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PlayDeep",
  description: "Deep Learning para detectar, analizar y visualizar cada jugada en todo detalle",
  icons: {
    icon: [
      {
        url: '/playdeep-icon.png',
        href: '/playdeep-icon.png',
      }
    ]
  }
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ToastProvider>
          <ClientQueryProvider>
          <div className="min-h-screen flex flex-col navbar-dark">
            <Navbar />
              <main className="flex-grow mt-16 bg-football-dark">{children}</main>
            <Footer />
          </div>
          </ClientQueryProvider>
          <Toaster />
        </ToastProvider>
        

      </body>
    </html>
  );
}
