"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Network, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { AuthModal, type AuthTab } from "@/components/ui-auth/auth-modal";
import { cn } from "@/lib/utils";

/**
 * Botón de cierre de sesión reutilizado por la barra (escritorio) y por el
 * panel móvil. Recibe el estado de `SiteHeader` para que el texto pendiente y
 * `aria-busy` se mantengan sincronizados en ambas ubicaciones.
 */
function SignOutButton({
  testId,
  className,
  disabled,
  busy,
  onClick,
}: {
  testId: string;
  className?: string;
  disabled: boolean;
  busy: boolean;
  onClick: () => void;
}): React.JSX.Element {
  return (
    <Button
      type="button"
      data-testid={testId}
      variant="ghost"
      size="sm"
      className={cn(
        "h-11 min-w-11 px-3 text-[13px] text-destructive hover:bg-destructive/10",
        className,
      )}
      disabled={disabled}
      aria-busy={busy}
      onClick={onClick}
    >
      {busy ? "Cerrando sesión…" : "Cerrar sesión"}
    </Button>
  );
}

/**
 * Navbar compartida de la landing y de la app.
 * - Sin sesión: "Iniciar sesión" y "Registrarse" (modal de cuenta único).
 * - Con sesión: avatar + nombre, enlaces "Mis tareas"/"Tokens MCP" y
 *   "Cerrar sesión", que vuelve a la landing en estado anónimo. En móvil el
 *   avatar queda en la barra con la hamburguesa a su derecha y "Cerrar sesión"
 *   se despliega dentro del panel `#mobile-nav`.
 */
export function SiteHeader(): React.JSX.Element {
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<AuthTab>("login");
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  // Navegación de sesión en móvil (<640px), donde los enlaces no caben
  // visibles junto al avatar y "Cerrar sesión".
  const [navOpen, setNavOpen] = useState(false);
  const navToggleWrapperRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  const user = session?.user;

  // El panel móvil se cierra con Escape (devolviendo el foco al botón que lo
  // abrió) o al pulsar fuera del header. Escape se escucha en `document`
  // porque el foco puede salir del header con el panel aún abierto.
  useEffect(() => {
    if (!navOpen) return;
    const focusToggle = () => {
      navToggleWrapperRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setNavOpen(false);
      focusToggle();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (headerRef.current?.contains(event.target as Node)) return;
      setNavOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [navOpen]);

  const openModal = (tab: AuthTab) => {
    setModalTab(tab);
    setModalOpen(true);
    setNavOpen(false);
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
      setNavOpen(false);
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
      "inline-flex h-11 min-w-11 items-center justify-center rounded-md px-3 text-[15px] transition-colors duration-150",
      pathname === href
        ? "bg-elevated text-ink"
        : "text-muted hover:bg-elevated hover:text-ink",
    );

  const panelLinkClass = (href: string) =>
    cn(
      "inline-flex min-h-11 w-full items-center rounded-md px-3 text-[15px] transition-colors duration-150",
      pathname === href
        ? "bg-elevated text-ink"
        : "text-muted hover:bg-elevated hover:text-ink",
    );

  return (
    <header
      ref={headerRef}
      data-testid="site-header"
      className="sticky top-0 z-40 bg-ground"
    >
      <div className="mx-auto flex h-14 w-full max-w-[1024px] items-center justify-between gap-4 px-5">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center font-display text-[17px] font-semibold tracking-[-0.01em] text-ink"
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
                    // configurar dominios remotos en next/image (excepción
                    // aceptada en la auditoría de calidad).
                    // eslint-disable-next-line @next/next/no-img-element
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
                <span
                  role="alert"
                  className="hidden text-[12px] text-destructive sm:inline"
                >
                  {signOutError}
                </span>
              )}
              {/* Solo desde `sm`: en móvil el cierre de sesión vive en el
                  panel `#mobile-nav` y el envoltorio oculto evita que el botón
                  sea visible o enfocable con el teclado. */}
              <div className="hidden sm:flex">
                <SignOutButton
                  testId="auth-signout-btn"
                  disabled={signingOut}
                  busy={signingOut}
                  onClick={handleSignOut}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                data-testid="auth-login-btn"
                variant="outline"
                size="sm"
                className="h-11 min-w-11 px-3"
                onClick={() => openModal("login")}
              >
                Iniciar sesión
              </Button>
              <Button
                data-testid="auth-register-btn"
                size="sm"
                className="h-11 min-w-11 px-3"
                onClick={() => openModal("register")}
              >
                Registrarse
              </Button>
            </div>
          )}

          {user && (
            <div ref={navToggleWrapperRef} className="sm:hidden">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                data-testid="nav-menu-btn"
                aria-label={navOpen ? "Cerrar navegación" : "Abrir navegación"}
                aria-expanded={navOpen}
                aria-controls="mobile-nav"
                className="size-11"
                onClick={() => setNavOpen((open) => !open)}
              >
                {navOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
              </Button>
            </div>
          )}

          {/* Enlace secundario: explica cómo está construida la app. Apunta al
              documento estático publicado en `/arquitectura` y lo abre en otra
              pestaña para no perder la demo. Se oculta por debajo de `sm`,
              donde el header no tiene espacio: en móvil con sesión vive en el
              panel `#mobile-nav` y, sin sesión, en el pie de la landing.
              Entre `sm` y `lg` va solo con icono (con `aria-label`): la
              etiqueta no cabe junto a los enlaces de sesión sin partir el
              resto de controles en varias líneas. */}
          <a
            href="/arquitectura"
            target="_blank"
            rel="noreferrer"
            data-testid="nav-arquitectura"
            aria-label="Cómo está hecha"
            title="Cómo está hecha"
            className="hidden h-11 min-w-11 items-center gap-2 rounded-md px-3 text-[15px] text-muted transition-colors duration-150 hover:bg-elevated hover:text-ink sm:inline-flex"
          >
            <Network aria-hidden="true" className="size-4" />
            <span className="hidden lg:inline">Cómo está hecha</span>
          </a>
        </div>
      </div>

      {user && (
        <nav
          id="mobile-nav"
          aria-label="Navegación de sesión"
          className={cn(
            "absolute inset-x-0 top-full z-50 border-t border-ink/10 bg-ground px-5 pb-4 pt-3 sm:hidden",
            navOpen ? "flex flex-col gap-1" : "hidden",
          )}
        >
          <Link
            href="/tareas"
            aria-current={pathname === "/tareas" ? "page" : undefined}
            className={panelLinkClass("/tareas")}
            onClick={() => setNavOpen(false)}
          >
            Mis tareas
          </Link>
          <Link
            href="/mcp"
            aria-current={pathname === "/mcp" ? "page" : undefined}
            className={panelLinkClass("/mcp")}
            onClick={() => setNavOpen(false)}
          >
            Tokens MCP
          </Link>
          <a
            href="/arquitectura"
            target="_blank"
            rel="noreferrer"
            data-testid="nav-arquitectura-movil"
            className={cn(panelLinkClass("/arquitectura"), "gap-2")}
            onClick={() => setNavOpen(false)}
          >
            <Network aria-hidden="true" className="size-4" />
            Cómo está hecha
          </a>
          {/* Cierre de sesión en móvil: separado de la navegación y con el
              error junto a la acción que lo provocó. */}
          <div className="mt-2 border-t border-ink/10 pt-2">
            {signOutError && (
              <p role="alert" className="px-3 pb-2 text-[12px] text-destructive">
                {signOutError}
              </p>
            )}
            <SignOutButton
              testId="auth-signout-btn-movil"
              disabled={signingOut}
              busy={signingOut}
              onClick={handleSignOut}
              className="w-full justify-start"
            />
          </div>
        </nav>
      )}

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
