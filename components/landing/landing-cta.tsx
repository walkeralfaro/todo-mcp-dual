"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthModal, type AuthTab } from "@/components/ui-auth/auth-modal";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export interface LandingCtaProps {
  /** Variante visual: hero y cierre sobre el campo acento; footer en banda. */
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

  // Un redirect de protección (`?auth=...`) abre el modal una sola vez.
  useEffect(() => {
    if (initialTab) {
      setTab(initialTab);
      setOpen(true);
    }
  }, [initialTab]);

  const openModal = (targetTab: AuthTab) => {
    setTab(targetTab);
    setOpen(true);
  };

  const big = variant !== "footer";
  const primaryClass = big
    ? "h-12 bg-ground px-6 text-ink hover:bg-surface"
    : "h-11 bg-accent px-4 text-[15px] hover:bg-accent/90";
  const linkClass = big
    ? "inline-flex h-11 items-center px-2 text-[15px] font-medium text-[#06130c] underline decoration-[#06130c]/40 underline-offset-4 transition-transform duration-150 hover:decoration-[#06130c] active:translate-y-px"
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
