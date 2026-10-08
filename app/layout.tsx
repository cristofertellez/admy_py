import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { getUser } from "@/lib/auth";
import { SettingsService } from "@/features/settings";
import { APP_NAME, APP_DESCRIPTION } from "@/constants";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: `%s | ${APP_NAME}`,
    default: `${APP_NAME} — Project Management Platform`,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_NAME,
  },
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192" }],
  },
  // Legacy meta required for standalone mode on iOS < 16.4.
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f0f0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [user, autoUpdatesRaw] = await Promise.all([
    getUser(),
    // Historia 14.13 — PWA settings drive the update behavior (14.9).
    SettingsService.getValue("pwa_auto_updates").catch(() => null),
  ]);
  const autoUpdates = autoUpdatesRaw !== false;

  return (
    <html
      lang={user?.language ?? "en"}
      data-theme={user?.theme ?? "dark"}
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-canvas text-body antialiased">
        <Providers>{children}</Providers>
        <ServiceWorkerRegister autoUpdate={autoUpdates} />
      </body>
    </html>
  );
}
