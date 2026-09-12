import { Inter, Bricolage_Grotesque, JetBrains_Mono, Noto_Sans_Gujarati, Noto_Sans_Devanagari } from "next/font/google";

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

export const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
  preload: false,
});

export const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  preload: false,
});

// Loaded only when locale requires Gujarati — never ship to all visitors.
export const notoGujarati = Noto_Sans_Gujarati({
  subsets: ["gujarati"],
  variable: "--font-noto-gujarati",
  display: "swap",
  preload: false,
});

// Loaded only when locale requires Hindi.
export const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-noto-devanagari",
  display: "swap",
  preload: false,
});
