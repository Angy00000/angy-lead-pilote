import { auth } from "@/lib/auth/server";

// Proxy vers Neon Auth : toutes les routes /api/auth/* passent par ici.
export const { GET, POST, PUT, PATCH, DELETE } = auth.handler();
