"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
};

const navItems: NavItem[] = [
  { label: "Tableau de bord", href: "/dashboard" },
  { label: "Configurateur", href: "/configurateur" },
  { label: "Assistant", href: "/chat" },
  { label: "Historique", href: "/historique" },
];

type AppShellProps = {
  licenseDaysRemaining: number;
  children: React.ReactNode;
};

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-accent/15 text-accent"
                : "text-fg-muted hover:bg-surface-raised hover:text-fg",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function LicenseStatus({ daysRemaining }: { daysRemaining: number }) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-border bg-surface p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-fg-muted">Licence</span>
        <Badge variant="active">Actif</Badge>
      </div>
      <p className="text-xs text-fg-subtle">
        {daysRemaining} jour{daysRemaining > 1 ? "s" : ""} restant
        {daysRemaining > 1 ? "s" : ""}
      </p>
    </div>
  );
}

export function AppShell({ licenseDaysRemaining, children }: AppShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-dvh w-full">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col justify-between border-r border-border bg-surface p-4 lg:flex">
        <div className="flex flex-col gap-6">
          <Link href="/dashboard" className="px-3 text-lg font-bold">
            Plate<span className="text-accent">forme</span>
          </Link>
          <NavLinks pathname={pathname} />
        </div>
        <div className="flex flex-col gap-3">
          <LicenseStatus daysRemaining={licenseDaysRemaining} />
          <SignOutButton redirectUrl="/sign-in">
            <button
              type="button"
              className="rounded-md px-3 py-2 text-left text-sm text-fg-subtle transition-colors hover:bg-surface-raised hover:text-fg"
            >
              Déconnexion
            </button>
          </SignOutButton>
        </div>
      </aside>

      {/* Topbar mobile */}
      <header className="fixed inset-x-0 top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-surface px-4 lg:hidden">
        <Link href="/dashboard" className="text-lg font-bold">
          Plate<span className="text-accent">forme</span>
        </Link>
        <button
          type="button"
          aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="rounded-md px-3 py-1.5 text-sm text-fg-muted hover:bg-surface-raised hover:text-fg"
        >
          {menuOpen ? "Fermer" : "Menu"}
        </button>
      </header>

      {/* Menu mobile */}
      {menuOpen && (
        <div className="fixed inset-x-0 top-14 z-10 flex flex-col gap-4 border-b border-border bg-surface p-4 lg:hidden">
          <NavLinks pathname={pathname} onNavigate={() => setMenuOpen(false)} />
          <LicenseStatus daysRemaining={licenseDaysRemaining} />
        </div>
      )}

      <main className="w-full flex-1 px-4 pt-20 pb-8 lg:pt-8 lg:pl-68">
        {children}
      </main>
    </div>
  );
}
