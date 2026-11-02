import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { AuthCard } from "@/components/ui/auth-card";
import { getPendingEmail, maskEmail } from "@/lib/auth/pending";
import { VerifyForm } from "./verify-form";

export default function VerifyPage() {
  return (
    <AuthCard
      title="Confirmez votre adresse e-mail"
      footer={
        <Link href="/auth/sign-in" className="font-medium text-lp-electric hover:underline">
          Retour à la connexion
        </Link>
      }
    >
      <Suspense fallback={<p className="text-sm text-muted">Chargement…</p>}>
        <VerifyGate />
      </Suspense>
    </AuthCard>
  );
}

// Lit le cookie de vérification : à la requête uniquement.
async function VerifyGate() {
  await connection();
  const email = await getPendingEmail();
  if (!email) {
    return (
      <p className="text-sm text-muted">
        Aucune vérification en cours. Connectez-vous : si votre adresse n&apos;est pas encore confirmée, un nouveau code vous sera envoyé.
      </p>
    );
  }
  return <VerifyForm maskedEmail={maskEmail(email)} />;
}
