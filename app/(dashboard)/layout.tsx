// Espace vendeur — coquille reprise de flowmerce-web-app (app/dashboard/layout.tsx).
// Toute page sous (dashboard) exige une session ; sinon retour à /login.

import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FOCUS } from "@/components/dashboard/ui";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { SidebarShell } from "@/components/layout/SidebarShell";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { auth } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user;
  const displayName = user.name ?? user.email;
  const initial = displayName[0]?.toUpperCase() ?? "V";

  const sidebar = (
    <>
      <div className="border-b border-line px-5 pb-4 pt-5">
        <Link href="/" className={`inline-flex rounded-control ${FOCUS}`}>
          <Image src="/logos/logo-lockup.svg" alt="Flowmerce" width={132} height={26} priority />
        </Link>
        <p className="mt-2 text-[10.5px] text-faint">Espace vendeur — Sites</p>
      </div>

      <DashboardNav />

      <div className="mt-auto border-t border-line px-4 py-3">
        <div className="mb-3 flex items-center gap-2.5">
          <span
            aria-hidden
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-on-brand"
          >
            {initial}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold leading-none text-ink">
              {displayName}
            </span>
            <span className="mt-1 block truncate text-[11px] leading-none text-body">{user.email}</span>
          </span>
        </div>
        <SignOutButton />
      </div>
    </>
  );

  return <SidebarShell sidebar={sidebar}>{children}</SidebarShell>;
}
