import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

// Cadre commun des écrans d'authentification et d'onboarding.
export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mx-auto block w-28" aria-label="Accueil Angy LP">
          <Image src="/logo-lp.png" alt="Logo Angy LP" width={1536} height={1024} className="h-auto w-28" />
        </Link>
        <div className="mt-6 rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-semibold text-lp-deep">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-5 text-center text-sm text-muted">{footer}</div>}
      </div>
    </main>
  );
}
