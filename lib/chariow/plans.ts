// Plain data module (no "use server") — a "use server" file may only export
// async functions, so this constant must live outside app/activation/actions.ts
// to be importable from the client component that renders the plan cards.
export const CHARIOW_PLANS = [
  { id: "30j", productId: "prd_nby7ikmq", label: "1 mois", durationLabel: "30 jours" },
  { id: "90j", productId: "prd_6bkc9wgw", label: "3 mois", durationLabel: "90 jours" },
] as const;

export type PlanId = (typeof CHARIOW_PLANS)[number]["id"];
