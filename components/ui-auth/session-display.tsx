"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient, type Session } from "@/lib/auth-client";
import { AuthModal, type AuthTab } from "@/components/ui-auth/auth-modal";

/**
 * Muestra el estado de sesión en el header junto al titular del día.
 * - Sin sesión: botones "Iniciar sesión" y "Registrarse" que abren el modal
 *   en la pestaña correspondiente (estado controlado del tab).
 * - Con sesión: avatar (imagen de Google o genérico), nombre y "Cerrar sesión".
 * Tras autenticarse o cerrar sesión refresca el RSC con `router.refresh()`
 * para que formulario y listado reflejen la sesión sin recarga manual.
 */
export function SessionDisplay(): React.JSX.Element {
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<AuthTab>("login");
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const user = session?.user;

  const openModal = (tab: AuthTab) => {
    setModalTab(tab);
    setModalOpen(true);
  };

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError(null);
    try {
      const { error } = await authClient.signOut();
      if (error) {
        setSignOutError("No se pudo cerrar la sesión. Inténtalo de nuevo.");
        return;
      }
      setModalOpen(false);
      router.refresh();
    } catch {
      setSignOutError("No se pudo cerrar la sesión. Inténtalo de nuevo.");
    } finally {
      setSigningOut(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button
          data-testid="auth-login-btn"
          variant="outline"
          size="sm"
          onClick={() => openModal("login")}
        >
          Iniciar sesión
        </Button>
        <Button
          data-testid="auth-register-btn"
          size="sm"
          onClick={() => openModal("register")}
        >
          Registrarse
        </Button>
        <AuthModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          tab={modalTab}
          onTabChange={setModalTab}
          onAuthSuccess={() => {
            setModalOpen(false);
            router.refresh();
          }}
        />
      </div>
    );
  }

  const imageSrc = user.image ?? undefined;
  const initials = user.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <div
          data-testid="auth-avatar"
          className="flex size-8 items-center justify-center rounded-full bg-surface text-ink text-[13px] font-medium border border-ink/15 overflow-hidden"
        >
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={`Avatar de ${user.name ?? "usuario"}`}
              className="size-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
        <span data-testid="auth-user-name" className="text-[13px] font-medium text-ink">
          {user.name ?? user.email ?? "Usuario"}
        </span>
      </div>
      {signOutError && (
        <span role="alert" className="text-[12px] text-destructive">
          {signOutError}
        </span>
      )}
      <Button
        data-testid="auth-signout-btn"
        variant="ghost"
        size="sm"
        className="text-[13px] text-destructive hover:bg-destructive/10"
        disabled={signingOut}
        aria-busy={signingOut}
        onClick={handleSignOut}
      >
        {signingOut ? "Cerrando sesión…" : "Cerrar sesión"}
      </Button>
    </div>
  );
}
