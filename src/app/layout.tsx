import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { LiveChat } from "@/components/global/LiveChat";
import { VoiceAssistant } from "@/components/global/VoiceAssistant";
import { NotificationFlyout } from "@/components/global/NotificationFlyout";
import { TrackingProvider } from "@/components/tracking/TrackingProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "TravelSafe X — Predictive Life-Security Infrastructure",
  description: "India's first Predictive Life-Security Infrastructure. AI-powered safety routing, real-time threat detection, and community guardian networks.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${spaceGrotesk.variable} antialiased`}>
        <TrackingProvider>
          {children}
        </TrackingProvider>
        <LiveChat />
        <VoiceAssistant />
        <NotificationFlyout />
      </body>
    </html>
  );
}
