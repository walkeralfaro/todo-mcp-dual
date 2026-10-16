import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

function FieldGroup({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return <div data-slot="field-group" className={cn("flex flex-col gap-4", className)} {...props} />;
}

interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  "data-invalid"?: boolean;
}

function Field({ className, ...props }: FieldProps): React.JSX.Element {
  return <div data-slot="field" className={cn("flex flex-col gap-2", className)} {...props} />;
}

function FieldLabel({ className, ...props }: React.ComponentProps<typeof Label>): React.JSX.Element {
  return <Label data-slot="field-label" className={cn("text-sm font-medium", className)} {...props} />;
}

function FieldDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>): React.JSX.Element {
  return (
    <p data-slot="field-description" className={cn("text-[13px] leading-[1.5] text-muted", className)} {...props} />
  );
}

function FieldError({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>): React.JSX.Element {
  return (
    <p
      data-slot="field-error"
      role="alert"
      aria-live="polite"
      className={cn("text-[13px] leading-[1.5] font-medium text-destructive", className)}
      {...props}
    />
  );
}

export { FieldGroup, Field, FieldLabel, FieldDescription, FieldError };
