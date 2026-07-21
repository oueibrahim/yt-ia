import { AppShell } from "@/components/layout/app-shell";
import { licenseDaysRemaining, mockLicense } from "@/lib/mock/data";

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AppShell licenseDaysRemaining={licenseDaysRemaining(mockLicense)}>
      {children}
    </AppShell>
  );
}
