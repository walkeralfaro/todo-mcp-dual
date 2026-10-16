"use client";

export function DayHeadline({ pendientes }: { pendientes: number }): React.JSX.Element {
  return (
    <h1
      data-testid="day-headline"
      className="font-display text-[clamp(2.5rem,5vw,4.5rem)] font-semibold leading-[1] tracking-[-0.035em]"
    >
      {pendientes === 0 ? (
        "Todo al día"
      ) : (
        <>
          Hoy quedan{" "}
          <span key={pendientes} className="animate-headline-pulse tabular-nums text-accent">
            {pendientes}
          </span>
        </>
      )}
    </h1>
  );
}
