import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Layout autoritativo del grupo protegido (`/tareas`, `/mcp`): sin sesión
 * válida no se renderiza nada del contenido y el visitante vuelve a la
 * landing con el modal abierto y la ruta pedida en `next`.
 *
 * `proxy.ts` hace el chequeo optimista previo (solo presencia de cookie);
 * aquí la sesión se resuelve de verdad contra la DB. La ruta solicitada
 * llega en `x-pathname`, que `proxy.ts` inyecta en la request.
 */
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.JSX.Element> {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session?.user?.id) {
    const requested = requestHeaders.get("x-pathname") ?? "/tareas";
    redirect(`/?auth=login&next=${encodeURIComponent(requested)}`);
  }
  return <>{children}</>;
}
