import type { Metadata, Viewport } from "next";
import { Albert_Sans } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
  title: "Todo App",
  description: "Gestión de tareas con UI y MCP",
};

export const viewport: Viewport = {
  themeColor: "#0a0e1a",
};

const albertSans = Albert_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-albert-sans",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${albertSans.variable} min-h-dvh bg-ground font-text text-ink antialiased lg:h-dvh lg:overflow-hidden`}>
        <main className="mx-auto w-full max-w-[1024px] px-5 py-8 lg:h-dvh lg:min-h-0 lg:py-10">{children}</main>
      </body>
    </html>
  );
}
