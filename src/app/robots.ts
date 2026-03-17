import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://the-ledger.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/signup"],
        disallow: [
          "/dashboard",
          "/expenses",
          "/analytics",
          "/invoices",
          "/settings",
          "/add",
          "/view/",      // user-specific parental view pages
          "/api/",       // all API routes
          "/_next/",     // Next.js internals
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}
