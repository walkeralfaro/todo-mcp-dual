import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function Spinner({ className, ...props }: React.ComponentProps<typeof Loader2>): React.JSX.Element {
  return <Loader2 data-slot="spinner" role="status" aria-hidden="true" className={cn("size-4 animate-spin", className)} {...props} />;
}

export { Spinner };
