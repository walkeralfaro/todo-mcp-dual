import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Chequeo optimista de sesión para las rutas protegidas (`/tareas`, `/mcp`),
 * sin tocar la DB: si no hay cookie de sesión se redirige a la landing con
 * el modal abierto y la ruta pedida en `next`. Es la primera de las tres
 * capas de protección; la autoritativa es el layout de `app/(protegido)`.
 *
 * Cuando la cookie existe, inyecta `x-pathname` en la request para que el
 * layout protegido sepa a dónde volver si la sesión resulta inválida.
 */
export function proxy(request: NextRequest): NextResponse {
  const requested = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  if (!getSessionCookie(request)) {
    const url = new URL("/", request.url);
    url.searchParams.set("auth", "login");
    url.searchParams.set("next", requested);
    return NextResponse.redirect(url);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", requested);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/tareas", "/tareas/:path*", "/mcp", "/mcp/:path*"],
};
