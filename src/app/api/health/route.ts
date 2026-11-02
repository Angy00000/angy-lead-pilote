import { connection } from "next/server";
import { checkDatabase } from "@/lib/db";

// Vérification de santé : connexion à la base avec le rôle applicatif et
// passage par le rôle RLS. Ne renvoie aucune donnée, uniquement un statut.
// connection() : exécuté à chaque requête, jamais figé au build.
export async function GET() {
  await connection();
  const ok = await checkDatabase();
  return Response.json(
    { status: ok ? "ok" : "error" },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
