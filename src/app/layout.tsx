import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const SITE_URL = "https://tuck-vault.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Tuck — Your Personal Space | Private Vault & Daily Checklists",
    template: "%s | Tuck",
  },
  description:
    "A calm, private personal vault for identity cards (Aadhaar, PAN, DL, Passport), daily routine checklists, monthly budgets, and curated web links. 100% offline-first PWA with cloud sync.",
  keywords: [
    "personal vault",
    "document vault",
    "offline notes app",
    "routine checklist",
    "sub-tasks tracker",
    "aadhaar pan card wallet",
    "personal budget tracker",
    "saved links organizer",
    "offline first PWA",
    "private web notebook",
    "dexie indexeddb",
    "supabase sync",
  ],
  authors: [{ name: "Ravi Attrash" }],
  creator: "Ravi Attrash",
  publisher: "Tuck",
  applicationName: "Tuck",
  category: "Productivity",
  manifest: "/manifest.json",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "Tuck — Your Personal Space | Private Vault & Daily Checklists",
    description:
      "Stop digging through chats & screenshots. Organize ID cards with masked numbers, daily sub-tasks, budgets, and saved links in one calm, offline-first space.",
    url: SITE_URL,
    siteName: "Tuck",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tuck — Your Personal Space",
    description:
      "A calm, private personal vault for identity cards, daily checklists, monthly budgets, and curated links.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tuck",
  },
  verification: {
    google: "00f9059f5265dae5",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FAF8F5",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Tuck",
  url: SITE_URL,
  description:
    "A private, calm personal vault for identity cards, daily routine checklists, monthly budgets, and curated links. 100% offline-first with realtime cloud sync.",
  applicationCategory: "ProductivityApplication",
  operatingSystem: "All (Web, iOS, Android, macOS, Windows)",
  browserRequirements: "Requires JavaScript. Requires HTML5.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Personal Identity Card Vault with AES-256 masking",
    "Daily routine checklist with interactive sub-tasks",
    "Monthly budget and expense tracking",
    "Curated web links with domain tagging",
    "100% Offline-first Progressive Web App",
    "Realtime cloud synchronization via Supabase",
  ],
  screenshot: `${SITE_URL}/tuck-banner.svg`,
  creator: {
    "@type": "Person",
    name: "Ravi Attrash",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-[#FAF8F5] text-slate-800 antialiased font-sans selection:bg-indigo-100 selection:text-indigo-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
