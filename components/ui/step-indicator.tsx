import { cn } from "@/lib/utils";

type StepIndicatorProps = {
  steps: string[];
  current: number;
  className?: string;
};

export function StepIndicator({ steps, current, className }: StepIndicatorProps) {
  return (
    <ol className={cn("flex items-center gap-2", className)}>
      {steps.map((step, index) => {
        const isDone = index < current;
        const isCurrent = index === current;
        return (
          <li key={step} className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                isDone && "bg-accent text-white",
                isCurrent && "border-2 border-accent bg-accent/10 text-accent",
                !isDone && !isCurrent && "border border-border text-fg-subtle",
              )}
            >
              {isDone ? "✓" : index + 1}
            </span>
            <span
              className={cn(
                "hidden text-sm sm:inline",
                isCurrent ? "font-medium text-fg" : "text-fg-subtle",
              )}
            >
              {step}
            </span>
            {index < steps.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "h-px w-6",
                  isDone ? "bg-accent" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
