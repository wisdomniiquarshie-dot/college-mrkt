import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "COLLEGE MRKT — Student Marketplace",
    short_name: "COLLEGE MRKT",
    description: "Buy and sell with students at ATU and campuses across Ghana.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    background_color: "#fff8e8",
    theme_color: "#15452e",
    categories: ["shopping", "social"],
    icons: [
      {
        src: "/icons/college-mrkt-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/college-mrkt-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/college-mrkt-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
