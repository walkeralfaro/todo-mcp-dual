import type { Metadata, Viewport } from "next";
import { Albert_Sans } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
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
    <html lang="es" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={`${albertSans.variable} min-h-dvh bg-ground font-text text-ink antialiased`}>
        {/* La entrada escalonada oculta el contenido solo si el módulo de
            motion llega a hidratar; si no, se retira el flag a los 1,2 s y
            todo queda visible (sin JS nunca se pone). */}
        <script
          id="reveal-motion-flag"
          dangerouslySetInnerHTML={{
            __html:
              "(function(){var d=document.documentElement;d.setAttribute('data-motion','');setTimeout(function(){if(!window.__revealReady)d.removeAttribute('data-motion')},1200)})()",
          }}
        />
        <div className="flex min-h-dvh flex-col">
          <SiteHeader />
          {/* Sin contenedor: cada página decide su ancho (la landing puede
              necesitar campos a sangre completa). */}
          <main className="flex w-full flex-1 flex-col lg:min-h-0">{children}</main>
        </div>
      </body>
    </html>
  );
}
