import type { Metadata } from "next";
import { safeNextPath } from "@/lib/auth-redirect";
import { LandingHero } from "@/components/landing/landing-hero";
import { DemoBoard } from "@/components/landing/demo-board";
import { Mosaic, Stages, Tools } from "@/components/landing/landing-sections";
import { LandingClose, LandingFooter } from "@/components/landing/landing-close";

export const metadata: Metadata = {
  title: "Todo App · Tus tareas, para ti y para tus agentes",
  description:
    "Interfaz web y servidor MCP sobre la misma lista de tareas: crea, filtra y completa desde la página o desde tu agente.",
};

/**
 * Landing pública: el tablero real del producto como página (dirección
 * `dense-tiles`) con demo local sin persistencia y configuración MCP
 * copiable. Aquí viven el contrato de la ruta y el acceso dirigido
 * (`?auth=login|register` y `?next=...`), sin datos de ningún usuario.
 */
export default async function Landing({
  searchParams,
}: {
  searchParams?: Promise<{ auth?: string; next?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const initialTab =
    sp.auth === "login" || sp.auth === "register" ? sp.auth : null;
  const next = safeNextPath(sp.next);

  return (
    <div className="flex flex-col gap-2 px-3 py-3">
      <LandingHero initialTab={initialTab} next={next} />
      <DemoBoard />
      <Mosaic />
      <Stages />
      <Tools />
      <LandingClose />
      <LandingFooter />
    </div>
  );
}
