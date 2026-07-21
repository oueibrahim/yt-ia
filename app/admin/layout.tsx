import Link from "next/link";

// TODO(step 3 — Clerk): protect /admin/* with the Clerk `admin` role in the
// middleware. Until auth lands, this layout is reachable by direct URL only.
export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-4">
        <p className="text-lg font-bold">
          Plate<span className="text-accent">forme</span>
          <span className="ml-2 text-sm font-medium text-fg-subtle">Admin</span>
        </p>
        <Link
          href="/dashboard"
          className="text-sm text-fg-muted hover:text-fg"
        >
          ← Retour à la plateforme
        </Link>
      </header>
      <main className="w-full flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
