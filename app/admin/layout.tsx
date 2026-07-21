import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

// Session is enforced by proxy.ts; the `admin` role (Clerk publicMetadata)
// is checked here server-side so no session-token customization is needed.
export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  if (user.publicMetadata?.role !== "admin") redirect("/dashboard");
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
