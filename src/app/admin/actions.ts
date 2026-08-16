"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "../../lib/db";
import { recordAuthEvent } from "../../lib/auth/audit";
import { UnauthorizedError, requireAdminForAction } from "../../lib/auth/guards";

/**
 * Acciones del panel de administración.
 *
 * Tres reglas atraviesan todo este archivo:
 *
 * 1. **Nadie se opera a sí mismo.** Suspenderse o sacarse el rol por accidente
 *    deja a la persona afuera de la única pantalla desde la que podría
 *    arreglarlo. El error es trivial de cometer —la fila propia está en la misma
 *    lista que las demás— y carísimo de deshacer: hace falta entrar a la base.
 *
 * 2. **Siempre queda un administrador activo.** Sin esta guarda, degradar al
 *    último admin deja el producto sin panel y sin forma de recuperarlo desde la
 *    aplicación. Es el mismo agujero que obligó a escribir una herramienta de
 *    adopción a mano en agosto, y no vale la pena volver a caer.
 *
 * 3. **Todo queda en la bitácora**, con quién lo hizo y sobre quién. Una acción
 *    administrativa sin rastro es indistinguible de un abuso.
 */

export interface AdminActionState {
  status: "idle" | "success" | "error";
  message: string;
}

export const emptyAdminState: AdminActionState = { status: "idle", message: "" };

const failure = (message: string): AdminActionState => ({ status: "error", message });
const success = (message: string): AdminActionState => ({ status: "success", message });

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

function toState(error: unknown): AdminActionState {
  if (error instanceof UnauthorizedError) return failure(error.message);
  console.error("[admin] acción fallida", error instanceof Error ? error.name : "desconocido");
  return failure("No pudimos completar la operación.");
}

/** Cuenta administradores activos distintos del que se está por modificar. */
async function otherActiveAdmins(excludeUserId: string): Promise<number> {
  return getDb().user.count({
    where: { role: "ADMIN", status: "ACTIVE", id: { not: excludeUserId } },
  });
}

export async function suspendUserAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const admin = await requireAdminForAction();
    const targetId = text(formData, "userId");
    if (!targetId) return failure("Falta indicar la cuenta.");
    if (targetId === admin.id) return failure("No podés suspender tu propia cuenta.");

    const target = await getDb().user.findUnique({ where: { id: targetId } });
    if (!target) return failure("Esa cuenta no existe.");
    if (target.status === "SUSPENDED") return success("Esa cuenta ya estaba suspendida.");
    if (target.role === "ADMIN" && (await otherActiveAdmins(target.id)) === 0) {
      return failure("Es el último administrador activo. Nombrá otro antes de suspenderlo.");
    }

    const revoked = await getDb().$transaction(async (tx) => {
      await tx.user.update({ where: { id: target.id }, data: { status: "SUSPENDED" } });
      // Suspender sin cerrar las sesiones abiertas no suspende nada: la persona
      // sigue navegando con la cookie que ya tenía hasta que venza.
      const closed = await tx.session.updateMany({
        where: { userId: target.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return closed.count;
    });

    await recordAuthEvent({
      type: "USER_SUSPENDED",
      userId: target.id,
      context: `por:${admin.id}:sesiones:${revoked}`,
    });
    revalidatePath("/admin");
    return success(`Cuenta suspendida. Se cerraron ${revoked} sesiones.`);
  } catch (error) {
    return toState(error);
  }
}

/**
 * Deja entrar a una cuenta que nunca confirmó su correo.
 *
 * Existe porque la verificación por correo puede fallar por afuera del producto
 * —un dominio sin verificar en el proveedor, un mail que nunca llega— y sin esta
 * acción la única salida es entrar a la base a mano. Quien administra ya puede
 * suspender y borrar cuentas; dejar entrar a una es estrictamente menos que eso.
 *
 * Lo que **no** hace: tocar `emailVerifiedAt`. La dirección sigue sin estar
 * probada, y marcarla como verificada convertiría una decisión administrativa en
 * una prueba de control que nadie dio. La consecuencia práctica queda dicha en
 * pantalla: sin correo que funcione, esa persona no va a poder recuperar su
 * contraseña sola.
 *
 * Sólo alcanza a cuentas pendientes. Una suspendida se reactiva con su propia
 * acción, y una borrada no vuelve desde acá.
 */
export async function activatePendingUserAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const admin = await requireAdminForAction();
    const targetId = text(formData, "userId");
    if (!targetId) return failure("Falta indicar la cuenta.");

    const target = await getDb().user.findUnique({ where: { id: targetId } });
    if (!target) return failure("Esa cuenta no existe.");
    if (target.status === "ACTIVE") return success("Esa cuenta ya podía entrar.");
    if (target.status !== "PENDING_VERIFICATION") {
      return failure("Esta acción es sólo para cuentas que nunca confirmaron su correo.");
    }

    await getDb().user.update({ where: { id: target.id }, data: { status: "ACTIVE" } });
    await recordAuthEvent({
      type: "USER_ACTIVATED_WITHOUT_VERIFICATION",
      userId: target.id,
      context: `por:${admin.id}`,
    });
    revalidatePath("/admin");
    return success("Ya puede entrar con su correo y su contraseña. La dirección sigue sin verificar.");
  } catch (error) {
    return toState(error);
  }
}

export async function reactivateUserAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const admin = await requireAdminForAction();
    const targetId = text(formData, "userId");
    if (!targetId) return failure("Falta indicar la cuenta.");

    const target = await getDb().user.findUnique({ where: { id: targetId } });
    if (!target) return failure("Esa cuenta no existe.");
    // Reactivar una cuenta borrada la resucitaría con datos que la persona pidió
    // eliminar. La baja es una decisión de su dueño y no se revierte desde acá.
    if (target.status === "DELETED") return failure("Una cuenta dada de baja no se reactiva desde el panel.");
    if (target.status === "ACTIVE") return success("Esa cuenta ya estaba activa.");

    await getDb().user.update({ where: { id: target.id }, data: { status: "ACTIVE" } });
    await recordAuthEvent({
      type: "USER_REACTIVATED",
      userId: target.id,
      context: `por:${admin.id}`,
    });
    revalidatePath("/admin");
    return success("Cuenta reactivada. La persona ya puede volver a entrar.");
  } catch (error) {
    return toState(error);
  }
}

export async function changeRoleAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const admin = await requireAdminForAction();
    const targetId = text(formData, "userId");
    const role = text(formData, "role");
    if (!targetId) return failure("Falta indicar la cuenta.");
    if (role !== "ADMIN" && role !== "USER") return failure("Rol inválido.");
    if (targetId === admin.id) return failure("No podés cambiarte el rol a vos mismo.");

    const target = await getDb().user.findUnique({ where: { id: targetId } });
    if (!target) return failure("Esa cuenta no existe.");
    if (target.role === role) return success("Ya tenía ese rol.");
    if (role === "ADMIN" && target.status !== "ACTIVE") {
      return failure("Sólo una cuenta activa puede ser administradora.");
    }
    if (role === "USER" && (await otherActiveAdmins(target.id)) === 0) {
      return failure("Es el último administrador activo. Nombrá otro antes de quitarle el rol.");
    }

    await getDb().user.update({ where: { id: target.id }, data: { role } });
    await recordAuthEvent({
      type: "USER_ROLE_CHANGED",
      userId: target.id,
      context: `por:${admin.id}:a:${role}`,
    });
    revalidatePath("/admin");
    return success(role === "ADMIN" ? "Ahora es administradora." : "Ya no es administradora.");
  } catch (error) {
    return toState(error);
  }
}
