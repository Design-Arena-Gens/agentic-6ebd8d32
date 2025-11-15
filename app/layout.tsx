import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NightPulse Studio | AI Horror Story Crafter",
  description:
    "Create pulse-raising horror story videos with cinematic soundscapes and deep AI narration, ready for short-form platforms.",
  metadataBase: new URL("https://agentic-6ebd8d32.vercel.app")
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
