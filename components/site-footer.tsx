/**
 * Pie de página global. Participa del flujo normal dentro de la columna del
 * layout raíz (`min-h-dvh` + `main flex-1`), así que queda al borde inferior
 * del viewport cuando el contenido es corto y al final del documento cuando
 * hay scroll. No usa `position: fixed`.
 */
export function SiteFooter(): React.JSX.Element {
  return (
    <footer className="border-t border-ink/10 px-5 py-4 text-center text-[13px] text-muted">
      <p lang="en">
        developed with <span aria-hidden="true">❤️</span>
        <span className="sr-only">love</span> by walker alfaro
      </p>
    </footer>
  );
}
