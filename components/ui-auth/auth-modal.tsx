"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { authErrorToMessage } from "@/lib/auth-error";
import { postAuthPath } from "@/lib/auth-redirect";

export type AuthTab = "login" | "register";

export interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Estado controlado: el header decide qué pestaña abre el modal. */
  tab: AuthTab;
  onTabChange: (tab: AuthTab) => void;
  onAuthSuccess?: () => void;
  onAuthError?: (message: string) => void;
  /**
   * Ruta local a la que volver tras autenticarse (viene del redirect de
   * protección). Se valida con `postAuthPath`: si no es local, `/tareas`.
   */
  next?: string | null;
}

/**
 * Modal único de cuenta con dos pestañas: "Iniciar sesión" y "Registrarse",
 * más el acceso con Google. Autentica con Better Auth (email + contraseña).
 * Los errores se muestran una sola vez dentro del modal, que permanece
 * abierto y conserva lo tecleado. Al cerrarse se limpia error y campos.
 */
export function AuthModal({
  open,
  onOpenChange,
  tab,
  onTabChange,
  onAuthSuccess,
  onAuthError,
  next,
}: AuthModalProps): React.JSX.Element {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const isLogin = tab === "login";

  // Aperturas distintas empiezan limpias (entre pestañas y tras un fallo se
  // conservan los valores; entre abrir y cerrar el modal, no).
  useEffect(() => {
    if (open) return;
    setError(null);
    setEmail("");
    setPassword("");
    setName("");
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    // Better Auth devuelve { data, error } y no lanza en errores HTTP: sin
    // onAuthSuccess mientras haya error (el catch queda para fallos de red).
    try {
      const { error: authError } = isLogin
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({
            email,
            password,
            name: name || email.split("@")[0],
          });
      if (authError) {
        const message = authErrorToMessage(authError);
        setError(message);
        onAuthError?.(message);
        return;
      }
      onAuthSuccess?.();
      // Vuelve a la ruta solicitada por el redirect de protección (validada
      // como local) o a la app por defecto. Si ya estamos en esa ruta, basta
      // refrescar el RSC: push + refresh seguidos pueden abortar la navegación.
      const target = postAuthPath(next);
      if (window.location.pathname === target.split("?")[0]) {
        router.refresh();
      } else {
        router.push(target);
      }
    } catch (e) {
      const message = "Error de autenticación. Inténtalo de nuevo.";
      setError(message);
      onAuthError?.(message);
    } finally {
      setPending(false);
    }
  };

  const handleGoogle = async () => {
    setPending(true);
    try {
      const { error: authError } = await authClient.signIn.social({
        provider: "google",
        callbackURL: postAuthPath(next),
      });
      if (authError) {
        setError(authErrorToMessage(authError));
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{isLogin ? "Iniciar sesión" : "Crear cuenta"}</DialogTitle>
          <DialogDescription>
            Accede a tu cuenta para gestionar tus tareas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="auth-email">Correo electrónico</FieldLabel>
              <Input
                id="auth-email"
                name="email"
                type="email"
                data-testid="auth-email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tú@ejemplo.com"
                required
                disabled={pending}
                className="bg-ground"
              />
              {isLogin && (
                <FieldDescription id="auth-email-desc">
                  Usa el correo con el que te registraste.
                </FieldDescription>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="auth-password">Contraseña</FieldLabel>
              <Input
                id="auth-password"
                name="password"
                type="password"
                data-testid="auth-password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={8}
                required
                disabled={pending}
                className="bg-ground"
                aria-invalid={error ? true : undefined}
              />
              {!isLogin && (
                <FieldDescription id="auth-password-desc">
                  Mínimo 8 caracteres.
                </FieldDescription>
              )}
            </Field>
            {!isLogin && (
              <Field>
                <FieldLabel htmlFor="auth-name">Nombre (opcional)</FieldLabel>
                <Input
                  id="auth-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Juan Pérez"
                  disabled={pending}
                  className="bg-ground"
                />
              </Field>
            )}
          </FieldGroup>

          {error && (
            <FieldError data-testid="auth-error" className="text-center">
              {error}
            </FieldError>
          )}

          <Button
            type="submit"
            data-testid={isLogin ? "auth-login-submit" : "auth-register-submit"}
            disabled={pending}
            aria-busy={pending}
            className="min-h-11"
          >
            {pending && <Spinner data-icon="inline-start" />}
            {pending
              ? isLogin
                ? "Entrando…"
                : "Creando cuenta…"
              : isLogin
                ? "Iniciar sesión"
                : "Crear cuenta"}
          </Button>

          <div className="flex items-center gap-3 text-[13px] text-muted">
            <span className="h-px flex-1 bg-ink/10" />
            o continúa con
            <span className="h-px flex-1 bg-ink/10" />
          </div>
          <Button
            type="button"
            variant="outline"
            data-testid="auth-google-btn"
            disabled={pending}
            aria-busy={pending}
            className="min-h-11"
            onClick={handleGoogle}
          >
            {pending && <Spinner data-icon="inline-start" />}
            Continuar con Google
          </Button>
        </form>

        <DialogFooter>
          <Button
            data-testid={isLogin ? "auth-switch-register" : "auth-switch-login"}
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => onTabChange(isLogin ? "register" : "login")}
          >
            {isLogin
              ? "¿No tienes cuenta? Regístrate"
              : "¿Ya tienes cuenta? Inicia sesión"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
