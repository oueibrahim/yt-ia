import { cn } from "@/lib/utils";

type BadgeVariant = "active" | "pending" | "expired" | "suspended" | "neutral";

type BadgeProps = {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
};

const variantClasses: Record<BadgeVariant, string> = {
  active: "bg-success/15 text-success",
  pending: "bg-warning/15 text-warning",
  expired: "bg-danger/15 text-danger",
  suspended: "bg-fg-subtle/20 text-fg-muted",
  neutral: "bg-surface-raised text-fg-muted",
};

export function Badge({ variant = "neutral", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
