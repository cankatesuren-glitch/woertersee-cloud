import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WörterSee — German vocabulary that stays",
  description: "Build focused decks, practise difficult words and keep your progress in sync."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

