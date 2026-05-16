import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/nav";
import Footer from "@/components/footer";
import ConvexClientProvider from "@/components/providers/ConvexClientProvider";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";

const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Herb — Farm-to-Market Trust Infrastructure",
  description:
    "Connecting East African smallholder farmers to global markets through verifiable, EUDR-compliant traceability.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistMono.variable} h-full antialiased`} style={{ fontFamily: "'Satoshi', system-ui, sans-serif" }}>
      <body className="min-h-full flex flex-col bg-black text-white" style={{ fontFamily: "'Satoshi', system-ui, sans-serif" }}>
        <ConvexAuthNextjsServerProvider>
          <ConvexClientProvider>
            <Nav />
            <main className="flex-1">{children}</main>
            <Footer />
          </ConvexClientProvider>
        </ConvexAuthNextjsServerProvider>
      </body>
    </html>
  );
}
