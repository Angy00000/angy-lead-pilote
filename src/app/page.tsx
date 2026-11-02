import Image from "next/image";
import Link from "next/link";

// Page d'attente — Phase 1 (Foundation).
// Aucune donnée affichée : le dashboard sera branché sur la base réelle
// une fois l'authentification et le multi-tenant en place.
// Logo officiel utilisé tel que fourni par le fondateur (public/logo-lp.png) — ne pas modifier.
// À remplacer par la version à fond transparent (PNG/SVG) dès qu'elle est fournie.

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-surface p-8 text-center shadow-sm sm:p-10">
        <Image
          src="/logo-lp.png"
          alt="Logo Angy LP"
          width={1536}
          height={1024}
          priority
          className="mx-auto h-auto w-40 sm:w-48"
        />
        <h1 className="mt-4 text-3xl font-semibold text-lp-deep sm:text-4xl">Angy LP</h1>
        <p className="mt-3 text-lg text-muted">
          Find opportunities. Understand buyers. Generate sales.
        </p>
        <div className="mx-auto mt-8 h-1 w-16 rounded-full bg-gradient-to-r from-lp-electric to-lp-cyan" />
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/auth/sign-up"
            className="rounded-lg bg-lp-electric px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-lp-deep"
          >
            Créer un compte
          </Link>
          <Link
            href="/auth/sign-in"
            className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-lp-deep transition hover:bg-lp-gray"
          >
            Se connecter
          </Link>
        </div>
        <p className="mt-6 text-sm text-muted">
          Plateforme en cours de construction — Phase 1 : Foundation.
        </p>
        <p className="mt-1 text-xs text-muted">Angy Company</p>
      </div>
    </main>
  );
}
