import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Data Alchemist - AI Resource Allocation Configurator",
  description: "Transform your messy spreadsheets into clean, validated data with AI-powered insights and automated rule generation.",
  keywords: ["data processing", "AI", "resource allocation", "spreadsheet automation", "validation"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50 antialiased`}>
        <div className="min-h-full">
          {children}
        </div>
      </body>
    </html>
  );
}
