// Page d'attente — Phase 1 (Foundation).
// Aucune donnée affichée : le dashboard sera branché sur la base réelle
// une fois l'authentification et le multi-tenant en place.
// Le logo officiel (monogramme LP) sera intégré tel que fourni par le fondateur.

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-surface p-8 shadow-sm sm:p-10">
        <p className="text-sm font-medium tracking-wide text-lp-electric">Angy Company</p>
        <h1 className="mt-2 text-3xl font-semibold text-lp-deep sm:text-4xl">Angy LP</h1>
        <p className="mt-3 text-lg text-muted">
          Find opportunities. Understand buyers. Generate sales.
        </p>
        <div className="mt-8 h-1 w-16 rounded-full bg-gradient-to-r from-lp-electric to-lp-cyan" />
        <p className="mt-6 text-sm text-muted">
          Plateforme en cours de construction — Phase 1 : Foundation.
        </p>
      </div>
    </main>
  );
}
