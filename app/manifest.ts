import type { MetadataRoute } from "next";

/** The one PWA manifest for the whole app, covering Market Associate and Partner only; Admin never gets it. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hook — Market Operations",
    short_name: "Hook",
    description: "Capture, confirm, and fulfil for Hook — for Market Associates and Partners.",
    // The manifest's single start_url is /launch, which then routes to the right dashboard by session.
    start_url: "/launch",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F5F5F5",
    theme_color: "#FFC809",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "New capture", short_name: "Capture", url: "/market-associate/submissions/new" },
      { name: "Availability checks", short_name: "Availability", url: "/market-associate/availability" },
      { name: "Browse catalog", short_name: "Browse", url: "/partner/browse" },
      { name: "Basket", short_name: "Basket", url: "/partner/basket" },
    ],
  };
}
