import { cn } from "@/lib/utils";

type AlertVariant = "info" | "success" | "danger";

type AlertProps = {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
};

const variantClasses: Record<AlertVariant, string> = {
  info: "border-info/40 bg-info/10 text-info",
  success: "border-success/40 bg-success/10 text-success",
  danger: "border-danger/40 bg-danger/10 text-danger",
};

export function Alert({ variant = "info", title, children, className }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-md border p-4 text-sm",
        variantClasses[variant],
        className,
      )}
    >
      {title && <p className="mb-1 font-semibold">{title}</p>}
      <div className="text-fg-muted">{children}</div>
    </div>
  );
}
