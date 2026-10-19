"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDownIcon, Menu, Network, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { AuthModal, type AuthTab } from "@/components/ui-auth/auth-modal";
import { shortDisplayName } from "@/lib/user-display-name";
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
 * Avatar del usuario (imagen de OAuth o iniciales). Se monta dos veces: dentro
 * del disparador del menú de escritorio (decorativo, con `decorative`) y suelto
 * en la barra móvil. Cada instancia lleva su propio `data-testid` para que los
 * selectores de prueba no resuelvan a dos elementos a la vez.
 */
function UserAvatar({
  testId,
  imageSrc,
  name,
  initials,
  className,
  decorative = false,
}: {
  testId: string;
  imageSrc: string | undefined;
  name: string;
  initials: string;
  className?: string;
  decorative?: boolean;
}): React.JSX.Element {
  return (
    <span
      data-testid={testId}
      aria-hidden={decorative || undefined}
      className={cn(
        "flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-ink/15 bg-surface text-[13px] font-medium text-ink",
        className,
      )}
    >
      {imageSrc ? (
        // Avatar externo de OAuth: <img> es suficiente y evita configurar
        // dominios remotos en next/image (excepción aceptada en la auditoría
        // de calidad).
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt={`Avatar de ${name}`}
          className="size-full object-cover"
        />
      ) : (
        initials
      )}
    </span>
  );
}

/**
 * Navbar compartida de la landing y de la app.
 * - Sin sesión: "Iniciar sesión" y "Registrarse" (modal de cuenta único).
 * - Con sesión: "Mis tareas" y el enlace a la documentación en la barra; el
 *   avatar + nombre abren el menú de usuario de escritorio, que contiene
 *   "Tokens MCP" y "Cerrar sesión" (vuelve a la landing en estado anónimo).
 *   En móvil el avatar queda en la barra con la hamburguesa a su derecha y las
 *   mismas acciones se despliegan dentro del panel `#mobile-nav`.
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
  // Menú de usuario de escritorio (≥640px): contiene "Tokens MCP" y el cierre
  // de sesión. Es controlado para poder mantenerlo abierto si el cierre falla.
  const [menuOpen, setMenuOpen] = useState(false);
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
      setMenuOpen(false);
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
              <Link
                href="/tareas"
                data-testid="nav-tareas"
                aria-current={pathname === "/tareas" ? "page" : undefined}
                className={linkClass("/tareas")}
              >
                Mis tareas
              </Link>
            )}
          </nav>

          {user ? (
            <div className="flex items-center gap-2">
              {/* Menú de usuario (escritorio, ≥640 px). Por debajo de `sm` el
                  disparador no se monta y las mismas acciones viven en el
                  panel `#mobile-nav`. */}
              <div className="hidden sm:flex">
                <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                  <DropdownMenuTrigger
                    data-testid="auth-user-menu-btn"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    aria-controls="user-menu"
                    className="inline-flex h-11 min-w-11 items-center gap-2 rounded-md px-2 text-[15px] text-ink transition-colors duration-150 hover:bg-elevated"
                  >
                    <UserAvatar
                      testId="auth-avatar-menu"
                      imageSrc={imageSrc}
                      name={user.name ?? "usuario"}
                      initials={initials}
                      decorative
                    />
                    <span
                      data-testid="auth-user-name"
                      className="hidden max-w-[10ch] truncate text-[13px] font-medium text-ink md:inline"
                    >
                      {shortDisplayName(user.name, user.email ?? "Usuario")}
                    </span>
                    <ChevronDownIcon
                      aria-hidden="true"
                      className="size-4 text-muted"
                    />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent id="user-menu" align="end">
                    <DropdownMenuItem asChild className="min-h-11">
                      <Link href="/mcp" data-testid="nav-mcp">
                        <Network
                          aria-hidden="true"
                          className="size-4 text-muted"
                        />
                        Tokens MCP
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {signOutError && (
                      <p
                        role="alert"
                        className="px-2 py-1 text-[12px] text-destructive"
                      >
                        {signOutError}
                      </p>
                    )}
                    <DropdownMenuItem
                      variant="destructive"
                      data-testid="auth-signout-btn"
                      className="min-h-11"
                      disabled={signingOut}
                      aria-busy={signingOut}
                      onSelect={(event) => {
                        // Sin `preventDefault` Radix cerraría el menú y el
                        // error de cierre de sesión quedaría oculto.
                        event.preventDefault();
                        void handleSignOut();
                      }}
                    >
                      {signingOut ? "Cerrando sesión…" : "Cerrar sesión"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Avatar de la barra por debajo de `sm`, donde el disparador del
                  menú no se monta. */}
              <UserAvatar
                testId="auth-avatar"
                imageSrc={imageSrc}
                name={user.name ?? "usuario"}
                initials={initials}
                className="sm:hidden"
              />
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
              pestaña para no perder la demo. Va destacado con el color de
              acento (chip translúcido) para distinguirse del resto de enlaces.
              Se oculta por debajo de `sm`, donde el header no tiene espacio: en
              móvil con sesión vive en el panel `#mobile-nav` y, sin sesión, en
              el pie de la landing. Entre `sm` y `lg` va solo con icono (con
              `aria-label`): la etiqueta no cabe junto a los enlaces de sesión
              sin partir el resto de controles en varias líneas. */}
          <a
            href="/arquitectura"
            target="_blank"
            rel="noreferrer"
            data-testid="nav-arquitectura"
            aria-label="Cómo está hecha"
            title="Cómo está hecha"
            className="hidden h-11 min-w-11 items-center gap-2 rounded-md border border-accent/25 bg-accent/10 px-3 text-[15px] font-medium text-accent transition-colors duration-150 hover:bg-accent/20 hover:text-accent sm:inline-flex"
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
