"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

declare global {
  interface Window {
    /** Marca que el módulo de motion hidrató (lo usa el script del layout). */
    __revealReady?: boolean;
  }
}

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Retardo escalonado dentro de su sección (ms). */
  delay?: number;
  style?: CSSProperties;
}

/**
 * Entrada escalonada por sección (transform + opacity, 300 ms ease-out).
 * El estado inicial oculto lo aplica `html[data-motion]` (script en el layout)
 * y solo con JS: sin hidratar, el contenido queda visible; si el módulo no
 * hidrata en ~1,2 s, el propio script retira `data-motion` como red de
 * seguridad para que nada se pierda.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  style,
}: RevealProps): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.__revealReady = true;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-in");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add("is-in");
            observer.unobserve(el);
          }
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.08 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-reveal
      className={className}
      style={delay ? { transitionDelay: `${delay}ms`, ...style } : style}
    >
      {children}
    </div>
  );
}
