import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Ledger — Student Expense Tracker",
    short_name: "The Ledger",
    description:
      "Log daily spending, categorise purchases, and generate parent invoices — all in one clean student finance dashboard.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#F4F5FB",
    theme_color: "#6366f1",
    orientation: "portrait-primary",
    categories: ["finance", "productivity", "education"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
