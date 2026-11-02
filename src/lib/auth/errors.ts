import type { AuthError } from "./server";

// Messages d'erreur en français. Les détails techniques restent côté serveur.
const MESSAGES: Record<string, string> = {
  USER_ALREADY_EXISTS: "Un compte existe déjà avec cette adresse e-mail.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Un compte existe déjà avec cette adresse e-mail.",
  INVALID_EMAIL_OR_PASSWORD: "E-mail ou mot de passe incorrect.",
  INVALID_EMAIL: "Adresse e-mail invalide.",
  PASSWORD_TOO_SHORT: "Le mot de passe doit contenir au moins 8 caractères.",
  PASSWORD_TOO_LONG: "Le mot de passe est trop long.",
  EMAIL_NOT_VERIFIED: "Veuillez d'abord confirmer votre adresse e-mail.",
  ORGANIZATION_ALREADY_EXISTS: "Ce nom d'organisation est déjà utilisé.",
  YOU_HAVE_REACHED_THE_MAXIMUM_NUMBER_OF_ORGANIZATIONS: "Nombre maximal d'organisations atteint.",
};

export function authErrorMessage(error: AuthError | null | undefined, fallback: string): string {
  if (error?.code && MESSAGES[error.code]) return MESSAGES[error.code];
  if (error) console.warn("[auth]", error.code ?? "UNKNOWN", error.status ?? "");
  return fallback;
}
