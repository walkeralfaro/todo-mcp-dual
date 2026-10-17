"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { copyTextToClipboard } from "@/lib/clipboard";

type CopyState = "idle" | "copied" | "error";

interface CopyButtonProps extends Omit<ButtonProps, "onClick" | "children"> {
  /** Texto que se copia al portapapeles. */
  value: string;
  label?: string;
  copiedLabel?: string;
}

/** Botón de copiar con confirmación breve ("Copiado"/"No se pudo copiar"). */
export function CopyButton({
  value,
  label = "Copiar",
  copiedLabel = "Copiado",
  variant = "outline",
  size = "sm",
  ...props
}: CopyButtonProps): React.JSX.Element {
  const [state, setState] = useState<CopyState>("idle");
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  async function handleCopy(): Promise<void> {
    const ok = await copyTextToClipboard(value);
    setState(ok ? "copied" : "error");
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState("idle"), 2000);
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleCopy}
      {...props}
    >
      {state === "copied" ? (
        <Check aria-hidden className="size-4" />
      ) : (
        <Copy aria-hidden className="size-4" />
      )}
      {state === "copied"
        ? copiedLabel
        : state === "error"
          ? "No se pudo copiar"
          : label}
    </Button>
  );
}
