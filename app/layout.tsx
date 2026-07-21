import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { frFR } from "@clerk/localizations";
import { dark } from "@clerk/ui/themes";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const clerkAppearance = {
  baseTheme: dark,
  variables: {
    colorPrimary: "#ff4d2e",
    colorPrimaryForeground: "#ffffff",
    colorBackground: "#15151c",
    colorInput: "#0b0b0f",
    colorInputForeground: "#f5f5f7",
    colorForeground: "#f5f5f7",
    colorMutedForeground: "#a0a0b0",
    colorDanger: "#f87171",
    borderRadius: "10px",
  },
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Plateforme — Assistant IA YouTube",
  description:
    "Créez votre chaîne YouTube et produisez vos scripts avec votre assistant IA personnalisé.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-fg">
        <ClerkProvider
          localization={frFR}
          appearance={clerkAppearance}
          signInFallbackRedirectUrl="/dashboard"
          signUpFallbackRedirectUrl="/dashboard"
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
