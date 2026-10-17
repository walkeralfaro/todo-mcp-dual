"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { AuthModal, type AuthTab } from "@/components/ui-auth/auth-modal";
import { cn } from "@/lib/utils";

/**
 * Navbar compartida de la landing y de la app.
 * - Sin sesión: "Iniciar sesión" y "Registrarse" (modal de cuenta único).
 * - Con sesión: avatar + nombre, enlaces "Mis tareas"/"Tokens MCP" y
 *   "Cerrar sesión", que vuelve a la landing en estado anónimo.
 */
export function SiteHeader(): React.JSX.Element {
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const pathname = usePathname();
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
      // Vuelve a la landing: las rutas protegidas redirigen igualmente sin
      // sesión. Si ya estamos en "/", basta refrescar (push + refresh
      // seguidos pueden abortar la navegación).
      if (window.location.pathname === "/") {
        router.refresh();
      } else {
        router.push("/");
      }
    } catch {
      setSignOutError("No se pudo cerrar la sesión. Inténtalo de nuevo.");
    } finally {
      setSigningOut(false);
    }
  };

  const imageSrc = user?.image ?? undefined;
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const linkClass = (href: string) =>
    cn(
      "inline-flex h-9 items-center rounded-md px-3 text-[15px] transition-colors duration-150",
      pathname === href
        ? "bg-elevated text-ink"
        : "text-muted hover:bg-elevated hover:text-ink",
    );

  return (
    <header
      data-testid="site-header"
      className="sticky top-0 z-40 bg-ground"
    >
      <div className="mx-auto flex h-14 w-full max-w-[1024px] items-center justify-between gap-4 px-5">
        <Link
          href="/"
          className="font-display text-[17px] font-semibold tracking-[-0.01em] text-ink"
        >
          Todo App
        </Link>

        <div className="flex items-center gap-2">
          <nav
            aria-label="Navegación principal"
            className="hidden items-center gap-1 sm:flex"
          >
            {user && (
              <>
                <Link
                  href="/tareas"
                  data-testid="nav-tareas"
                  aria-current={pathname === "/tareas" ? "page" : undefined}
                  className={linkClass("/tareas")}
                >
                  Mis tareas
                </Link>
                <Link
                  href="/mcp"
                  data-testid="nav-mcp"
                  aria-current={pathname === "/mcp" ? "page" : undefined}
                  className={linkClass("/mcp")}
                >
                  Tokens MCP
                </Link>
              </>
            )}
          </nav>

          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div
                  data-testid="auth-avatar"
                  className="flex size-8 items-center justify-center overflow-hidden rounded-full border border-ink/15 bg-surface text-[13px] font-medium text-ink"
                >
                  {imageSrc ? (
                    // Avatar externo de OAuth: <img> es suficiente y evita
                    // configurar dominios remotos en next/image.
                    <img
                      src={imageSrc}
                      alt={`Avatar de ${user.name ?? "usuario"}`}
                      className="size-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <span
                  data-testid="auth-user-name"
                  className="hidden max-w-[16ch] truncate text-[13px] font-medium text-ink md:inline"
                >
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
          ) : (
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
            </div>
          )}
        </div>
      </div>

      <AuthModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        tab={modalTab}
        onTabChange={setModalTab}
        onAuthSuccess={() => setModalOpen(false)}
      />
    </header>
  );
}
