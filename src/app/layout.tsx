import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Transforma tu forma de usar tus nuevos equipos HP",
  description: "Aplica estilos artísticos como Amigurumi, Anime, Ghibli y Cyberpunk a tus imágenes usando inteligencia artificial con equipos HP.",
  keywords: ["HP", "AI", "style transfer", "image transformation", "amigurumi", "anime", "ghibli", "cyberpunk", "Z.ai", "OpenAI"],
  authors: [{ name: "HP" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Transforma tu forma de usar tus nuevos equipos HP",
    description: "Aplica estilos artísticos a tus imágenes con IA y equipos HP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Transforma tu forma de usar tus nuevos equipos HP",
    description: "Aplica estilos artísticos a tus imágenes con IA y equipos HP",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
