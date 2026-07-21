import { Alert } from "@/components/ui";
import { cn } from "@/lib/utils";

type QuotaBannerProps = {
  used: number;
  limit: number;
};

export function QuotaBanner({ used, limit }: QuotaBannerProps) {
  const isFull = used >= limit;

  if (isFull) {
    return (
      <Alert variant="danger" title="Quota atteint">
        Vous avez utilisé tous vos messages du mois. Le quota se réinitialise le
        1er du mois prochain.
      </Alert>
    );
  }

  const ratio = Math.min(1, used / limit);

  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-raised">
        <div
          className={cn(
            "h-full rounded-full",
            ratio >= 0.9 ? "bg-warning" : "bg-accent",
          )}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <span className="text-xs whitespace-nowrap text-fg-subtle">
        {used} / {limit} messages ce mois-ci
      </span>
    </div>
  );
}
