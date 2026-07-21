import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getActiveLicense, licenseDaysRemaining } from "@/lib/db/licenses";
import { ensureStudent } from "@/lib/db/students";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const student = await ensureStudent();
  if (!student) redirect("/sign-in");

  const license = await getActiveLicense(student.id);
  const daysRemaining = license ? licenseDaysRemaining(license) : null;

  return (
    <AppShell licenseStatus={student.status} licenseDaysRemaining={daysRemaining}>
      {children}
    </AppShell>
  );
}
