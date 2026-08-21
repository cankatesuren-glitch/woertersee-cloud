import type { Metadata, Viewport } from "next";
import PwaRegistration from "./pwa-registration";
import "./globals.css";
import "./pwa.css";
import "./accessibility.css";

export const metadata: Metadata = {
  title: "WörterSee — German vocabulary that stays",
  description:
    "Build focused decks, practise difficult words and keep your progress in sync.",
  applicationName: "WörterSee",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "WörterSee", statusBarStyle: "default" },
  icons: { icon: "/icon", apple: "/icon" },
};

export const viewport: Viewport = {
  themeColor: "#173f38",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <div id="main-content" tabIndex={-1}>
          {children}
        </div>
        <PwaRegistration />
      </body>
    </html>
  );
}
