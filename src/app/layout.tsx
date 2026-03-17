import type { Metadata, Viewport } from "next";
import { Inter, Geist } from "next/font/google";
import { JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/frontend/components/ui/sonner";
import { AuthSessionProvider } from "@/frontend/components/session-provider";
import { NavigationLoader } from "@/frontend/components/navigation-loader";
import "@/frontend/styles/globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://the-ledger.vercel.app";
const DESCRIPTION =
  "The Ledger is a free student expense tracker for South Africa. Log daily spending, categorise purchases, and generate shareable invoices to send your parents — all in one clean dashboard.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),

  // ── Titles ──────────────────────────────────────────────────
  title: {
    default: "The Ledger — Student Expense Tracker",
    template: "%s | The Ledger",
  },

  // ── Core ────────────────────────────────────────────────────
  description: DESCRIPTION,
  keywords: [
    "student expense tracker",
    "South Africa student budget",
    "parent invoice app",
    "student spending tracker",
    "track expenses South Africa",
    "student finance app",
    "expense logger",
    "billable expenses",
  ],
  authors: [{ name: "Kovendan Jason Raman", url: "https://kovendan-portfolio.vercel.app/" }],
  creator: "Kovendan Jason Raman",

  // ── Google Site Verification (paste token below when ready) ─
  verification: {
    google: "NEhqMI18P14wC0nbd91S57DDLzOm0hdit9f8lJ-na_E",
  },

  // ── Open Graph ───────────────────────────────────────────────
  openGraph: {
    type: "website",
    url: APP_URL,
    siteName: "The Ledger",
    title: "The Ledger — Student Expense Tracker",
    description: DESCRIPTION,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "The Ledger — Student Expense Tracker",
      },
    ],
  },

  // ── Twitter / X card ────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: "The Ledger — Student Expense Tracker",
    description: DESCRIPTION,
    images: ["/og-image.png"],
    creator: "@KovendanRaman",
  },

  // ── Icons / PWA ──────────────────────────────────────────────
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.webmanifest",

  // ── Indexing defaults ────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1 },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#6366f1" },
    { media: "(prefers-color-scheme: dark)",  color: "#4f46e5" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <AuthSessionProvider>
          <NavigationLoader />
          {children}
          <Toaster />
        </AuthSessionProvider>
      </body>
    </html>
  );
}
