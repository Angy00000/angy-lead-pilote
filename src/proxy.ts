import { auth } from "@/lib/auth/server";

// Next.js 16 : proxy.ts remplace middleware.ts.
// Première barrière : redirige les visiteurs non connectés.
// Chaque page et action revérifie la session côté serveur (requireUser / requireTenant).
export default auth.middleware({ loginUrl: "/auth/sign-in" });

export const config = {
  matcher: ["/app/:path*", "/onboarding/:path*"],
};
