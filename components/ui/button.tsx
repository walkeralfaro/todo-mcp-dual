import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Mapa de intención (reutilizar en nuevos features):
// - primaria (Crear, Guardar): variant="default" size="default"|"sm"
// - secundaria / neutra (Cancelar, filtros): variant="secondary"|"outline"
// - sutil en fila (Editar, limpiar búsqueda): variant="ghost" size="sm"|"icon"
// - destructiva (Eliminar fila, Confirmar borrado): variant="destructive" (sólida en diálogo)
//   o ghost + text-destructive solo en fila densa si el sólido pesa demasiado.
const buttonVariants = cva(
  "inline-flex shrink-0 touch-manipulation items-center justify-center gap-2 whitespace-nowrap rounded-md text-base font-medium transition-[color,background-color,transform] duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ground active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 aria-invalid:ring-destructive/20 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-accent text-ground hover:bg-accent/90",
        secondary: "bg-surface text-ink hover:bg-surface/80",
        outline: "border border-ink/15 bg-ground hover:bg-surface",
        ghost: "hover:bg-surface hover:text-ink",
        destructive: "bg-destructive text-ground hover:bg-destructive/90",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-[15px]",
        lg: "h-10 px-6",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps): React.JSX.Element {
  const Comp = asChild ? Slot : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { Button, buttonVariants };
