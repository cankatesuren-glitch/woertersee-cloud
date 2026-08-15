import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WörterSee",
    short_name: "WörterSee",
    description:
      "Focused German vocabulary practice that follows your progress.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fffdf7",
    theme_color: "#0b2454",
    orientation: "any",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
