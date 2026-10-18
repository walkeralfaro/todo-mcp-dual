import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-libsql", "@libsql/client"],
  /**
   * Documentación de arquitectura: el documento autocontenido vive en `docs/`
   * y lo publica `scripts/sync-arquitectura.mjs` en `public/arquitectura.html`
   * (hooks `predev`/`prebuild`). La reescritura va en `beforeFiles` porque esa
   * fase se evalúa antes de los estáticos de `public/`, de modo que la URL
   * pública es `/arquitectura` y `/arquitectura.html` sigue respondiendo.
   */
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/arquitectura", destination: "/arquitectura.html" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
