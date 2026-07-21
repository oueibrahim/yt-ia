import type { StudentStatus } from "./types";

export const statusLabels: Record<StudentStatus, string> = {
  active: "Actif",
  pending_license: "En attente",
  expired: "Expiré",
  suspended: "Suspendu",
};

export const statusLongLabels: Record<StudentStatus, string> = {
  active: "Licence active",
  pending_license: "Licence en attente d'activation",
  expired: "Licence expirée",
  suspended: "Compte suspendu",
};

export const statusBadgeVariants: Record<
  StudentStatus,
  "active" | "pending" | "expired" | "suspended"
> = {
  active: "active",
  pending_license: "pending",
  expired: "expired",
  suspended: "suspended",
};
