import localFont from "next/font/local";
import Navbar from "../components/Navbar";

import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "Tutor AI",
  description: "Tutor AI - Your personal AI tutor",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`w-full ${geistSans.variable} ${geistMono.variable} antialiased
       
        `}
      >
        <Navbar />
        {children}
      </body>
    </html>
  );
}
