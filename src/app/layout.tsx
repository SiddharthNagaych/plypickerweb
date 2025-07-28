import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { CityProvider } from "@/components/home/common/context/CityContext";
import Navbar from "@/components/home/Navbar";
import { ReduxProvider } from "@/components/cart/provider/ReduxProvider";
import { GoogleMapsProvider } from "@/components/home/common/context/GoogleMapsContext";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      
  
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SessionProvider>
          <GoogleMapsProvider>
            <CityProvider>
              <ReduxProvider>
                <Navbar />
                <div id="portal-root" className="z-[9999]" />
                {children}
              </ReduxProvider>
            </CityProvider>
          </GoogleMapsProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
