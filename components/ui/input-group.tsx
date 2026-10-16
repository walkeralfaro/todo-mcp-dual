import * as React from "react";
import { cn } from "@/lib/utils";

function InputGroup({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <div
      data-slot="input-group"
      className={cn(
        "flex h-9 w-full min-w-0 items-center gap-1.5 rounded-md border border-ink/15 bg-ground px-3 py-2 shadow-xs transition-colors outline-none focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 focus-within:ring-offset-ground has-[[aria-invalid=true]]:border-destructive",
        className
      )}
      {...props}
    />
  );
}

function InputGroupInput({ className, ...props }: React.ComponentProps<"input">): React.JSX.Element {
  return (
    <input
      data-slot="input-group-input"
      className={cn(
        "w-full min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-search-cancel-button]:appearance-none",
        className
      )}
      {...props}
    />
  );
}

function InputGroupAddon({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <div
      data-slot="input-group-addon"
      className={cn("flex shrink-0 items-center gap-1.5 text-muted [&_svg]:size-4", className)}
      {...props}
    />
  );
}

export { InputGroup, InputGroupInput, InputGroupAddon };
