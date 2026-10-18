"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthModal, type AuthTab } from "@/components/ui-auth/auth-modal";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export interface LandingCtaProps {
  /** Variante visual: hero/cierre en superficie oscura; footer compacto. */
  variant?: "hero" | "close" | "footer";
  /** Pestaña a abrir desde `?auth=login|register` (redirect de protección). */
  initialTab?: AuthTab | null;
  /** Ruta de retorno validada (`safeNextPath`) desde `?next=...`. */
  next?: string | null;
  /** Prefijo de los `data-testid` (por defecto `landing`). */
  testIdPrefix?: string;
}

/**
 * Acción de acceso de la landing: sin sesión abre el modal de cuenta
 * (pestaña solicitada si viene de un redirect de protección); con sesión
 * enlaza a la app. Una sola acción primaria por variante; el enlace
 * secundario de acceso solo acompaña a la acción grande.
 */
export function LandingCta({
  variant = "hero",
  initialTab = null,
  next = null,
  testIdPrefix = "landing",
}: LandingCtaProps): React.JSX.Element {
  const { data: session } = authClient.useSession();
  const [open, setOpen] = useState(initialTab !== null);
  const [tab, setTab] = useState<AuthTab>(initialTab ?? "login");
  const [prevInitialTab, setPrevInitialTab] = useState(initialTab);

  // Un redirect de protección (`?auth=...`) abre el modal una sola vez. Si la
  // prop cambia (misma página con otro `?auth=`), el estado se ajusta durante
  // el render en lugar de en un efecto.
  if (initialTab && initialTab !== prevInitialTab) {
    setPrevInitialTab(initialTab);
    setTab(initialTab);
    setOpen(true);
  }

  const openModal = (targetTab: AuthTab) => {
    setTab(targetTab);
    setOpen(true);
  };

  const big = variant !== "footer";
  const primaryClass = big
    ? "h-12 bg-accent px-6 text-on-accent hover:bg-accent/90"
    : "h-11 bg-accent px-4 text-[15px] text-on-accent hover:bg-accent/90";
  const linkClass = big
    ? "inline-flex h-11 items-center px-2 text-[15px] font-medium text-ink underline decoration-ink/30 underline-offset-4 transition-colors hover:decoration-ink/70"
    : null;

  if (session?.user) {
    return (
      <Button
        asChild
        size={big ? "lg" : "sm"}
        className={cn(primaryClass)}
        data-testid={`${testIdPrefix}-open-app`}
      >
        <Link href="/tareas">Ir a mis tareas</Link>
      </Button>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-2", big ? "-ml-2" : "")}>
      <Button
        size={big ? "lg" : "sm"}
        className={cn(primaryClass)}
        data-testid={`${testIdPrefix}-register`}
        onClick={() => openModal("register")}
      >
        Crear cuenta
      </Button>
      {linkClass && (
        <button
          type="button"
          className={linkClass}
          data-testid={`${testIdPrefix}-login`}
          onClick={() => openModal("login")}
        >
          Iniciar sesión
        </button>
      )}
      <AuthModal
        open={open}
        onOpenChange={setOpen}
        tab={tab}
        onTabChange={setTab}
        onAuthSuccess={() => setOpen(false)}
        next={next}
      />
    </div>
  );
}
