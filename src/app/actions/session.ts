"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Cierra la sesión: elimina la cookie firmada y vuelve a la pantalla de acceso.
 * No toca la firma ni el TTL del token; solo borra la credencial del cliente.
 * El proxy revalida en cada request, por lo que volver con "atrás" no reingresa.
 */
export async function logoutAction(): Promise<void> {
  const store = await cookies();
  store.delete("doleth_session");
  redirect("/ingresar");
}
