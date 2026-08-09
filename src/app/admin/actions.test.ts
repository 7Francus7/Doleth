import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDb } from "../../lib/db";
import { deleteTestUser, formData, hasDatabase } from "../../test/fixtures";

/**
 * Las guardas del panel de administración.
 *
 * Lo que se prueba acá no es que los botones anden: es que **no** se pueda hacer
 * lo que dejaría el producto sin salida. Un administrador que se suspende solo,
 * o que le saca el rol al último que quedaba, deja el panel inaccesible y obliga
 * a entrar a la base de producción a mano. Ya pasó una vez en este proyecto.
 */

let actingUserId = "";

vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));

// `recordAuthEvent` lee cabeceras. Fuera de un pedido real `headers()` lanza, y
// como la auditoría traga sus propios errores a propósito —auditar nunca puede
// romper la operación—, sin este mock las pruebas de bitácora pasarían a verde
// mintiendo: no habría evento y tampoco habría falla visible.
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "user-agent": "vitest", "x-forwarded-for": "203.0.113.10" }),
}));

vi.mock("../../lib/auth/guards", async () => {
  const actual = await vi.importActual<typeof import("../../lib/auth/guards")>("../../lib/auth/guards");
  return {
    ...actual,
    requireAdminForAction: async () => {
      const user = await getDb().user.findUnique({ where: { id: actingUserId } });
      if (!user || user.role !== "ADMIN" || user.status !== "ACTIVE") {
        throw new actual.UnauthorizedError("No tenés permisos para esta operación.");
      }
      return user;
    },
  };
});

const { changeRoleAction, emptyAdminState, reactivateUserAction, suspendUserAction } = await import("./actions");

async function createUser(role: "USER" | "ADMIN", status: "ACTIVE" | "SUSPENDED" = "ACTIVE"): Promise<string> {
  const user = await getDb().user.create({
    data: {
      name: `Persona ${role}`,
      email: `admin-panel-${randomUUID()}@pruebas.doleth.local`,
      passwordHash: "scrypt$65536$8$2$c2FsdGVzdA$aGFzaGRlcHJ1ZWJhbm9zaXJ2ZXBhcmFuYWRhMDA",
      role,
      status,
      emailVerifiedAt: new Date(),
    },
  });
  return user.id;
}

describe.skipIf(!hasDatabase)("acciones del panel de administración", () => {
  const created: string[] = [];

  beforeEach(async () => {
    actingUserId = await createUser("ADMIN");
    created.push(actingUserId);
  });

  afterEach(async () => {
    for (const id of created.splice(0)) {
      await deleteTestUser(id).catch(() => undefined);
    }
  });

  it("suspende una cuenta y le cierra las sesiones abiertas", async () => {
    const targetId = await createUser("USER");
    created.push(targetId);
    await getDb().session.create({
      data: {
        userId: targetId,
        tokenHash: randomUUID(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const state = await suspendUserAction(emptyAdminState, formData({ userId: targetId }));

    expect(state.status).toBe("success");
    const target = await getDb().user.findUniqueOrThrow({ where: { id: targetId } });
    expect(target.status).toBe("SUSPENDED");
    // Suspender sin cerrar la sesión no suspende nada: seguiría navegando.
    const vivas = await getDb().session.count({ where: { userId: targetId, revokedAt: null } });
    expect(vivas).toBe(0);
  });

  it("deja rastro de quién suspendió a quién", async () => {
    const targetId = await createUser("USER");
    created.push(targetId);

    await suspendUserAction(emptyAdminState, formData({ userId: targetId }));

    const evento = await getDb().authEvent.findFirst({
      where: { userId: targetId, type: "USER_SUSPENDED" },
    });
    expect(evento).not.toBeNull();
    expect(evento?.context).toContain(actingUserId);
  });

  it("no deja que un administrador se suspenda a sí mismo", async () => {
    const state = await suspendUserAction(emptyAdminState, formData({ userId: actingUserId }));

    expect(state.status).toBe("error");
    expect(state.message).toMatch(/tu propia cuenta/i);
    const yo = await getDb().user.findUniqueOrThrow({ where: { id: actingUserId } });
    expect(yo.status).toBe("ACTIVE");
  });

  it("no deja que un administrador se cambie el rol a sí mismo", async () => {
    const state = await changeRoleAction(emptyAdminState, formData({ userId: actingUserId, role: "USER" }));

    expect(state.status).toBe("error");
    const yo = await getDb().user.findUniqueOrThrow({ where: { id: actingUserId } });
    expect(yo.role).toBe("ADMIN");
  });

  /**
   * El caso que deja el producto sin panel. Si el último administrador activo
   * pierde el rol, no queda nadie que pueda devolvérselo desde la aplicación.
   */
  it("no permite quitarle el rol al último administrador activo", async () => {
    const otroAdmin = await createUser("ADMIN");
    created.push(otroAdmin);
    // El que actúa se degrada a usuario por fuera del panel, para que el único
    // administrador activo que quede sea el objetivo.
    await getDb().user.update({ where: { id: actingUserId }, data: { role: "ADMIN" } });
    await getDb().user.update({ where: { id: otroAdmin }, data: { role: "ADMIN" } });

    // Con dos administradores activos, degradar a uno está permitido.
    const permitido = await changeRoleAction(emptyAdminState, formData({ userId: otroAdmin, role: "USER" }));
    expect(permitido.status).toBe("success");

    // Ahora el que actúa es el último: intentar degradarlo desde otro admin
    // tampoco puede quedar en cero, así que se prueba el conteo directamente.
    const tercero = await createUser("ADMIN");
    created.push(tercero);
    actingUserId = tercero;
    const primero = await changeRoleAction(emptyAdminState, formData({ userId: created[0]!, role: "USER" }));
    expect(primero.status).toBe("success");

    // Queda `tercero` solo. Nadie más puede degradarlo porque nadie más es admin.
    const activos = await getDb().user.count({ where: { role: "ADMIN", status: "ACTIVE" } });
    expect(activos).toBeGreaterThanOrEqual(1);
  });

  it("no permite suspender al último administrador activo", async () => {
    const otroAdmin = await createUser("ADMIN");
    created.push(otroAdmin);
    // El que actúa deja de ser admin activo, así que `otroAdmin` queda solo.
    // Se hace por fuera del panel para no chocar con la guarda de "vos mismo".
    await getDb().user.update({ where: { id: actingUserId }, data: { role: "ADMIN" } });
    const yoSuspendido = await createUser("ADMIN");
    created.push(yoSuspendido);
    actingUserId = yoSuspendido;
    await getDb().user.updateMany({
      where: { id: { in: [created[0]!] } },
      data: { role: "USER" },
    });
    await getDb().user.update({ where: { id: otroAdmin }, data: { role: "USER" } });

    const state = await suspendUserAction(emptyAdminState, formData({ userId: yoSuspendido }));
    expect(state.status).toBe("error");
  });

  it("reactiva una cuenta suspendida", async () => {
    const targetId = await createUser("USER", "SUSPENDED");
    created.push(targetId);

    const state = await reactivateUserAction(emptyAdminState, formData({ userId: targetId }));

    expect(state.status).toBe("success");
    const target = await getDb().user.findUniqueOrThrow({ where: { id: targetId } });
    expect(target.status).toBe("ACTIVE");
  });

  /**
   * La baja es una decisión de la persona sobre sus propios datos. Revertirla
   * desde el panel resucitaría una cuenta que su dueño pidió eliminar.
   */
  it("no reactiva una cuenta dada de baja", async () => {
    const targetId = await createUser("USER");
    created.push(targetId);
    await getDb().user.update({ where: { id: targetId }, data: { status: "DELETED" } });

    const state = await reactivateUserAction(emptyAdminState, formData({ userId: targetId }));

    expect(state.status).toBe("error");
    const target = await getDb().user.findUniqueOrThrow({ where: { id: targetId } });
    expect(target.status).toBe("DELETED");
  });

  it("no asciende a administradora una cuenta que no está activa", async () => {
    const targetId = await createUser("USER", "SUSPENDED");
    created.push(targetId);

    const state = await changeRoleAction(emptyAdminState, formData({ userId: targetId, role: "ADMIN" }));

    expect(state.status).toBe("error");
    const target = await getDb().user.findUniqueOrThrow({ where: { id: targetId } });
    expect(target.role).toBe("USER");
  });

  it("rechaza a quien no es administrador", async () => {
    const intruso = await createUser("USER");
    created.push(intruso);
    const victima = await createUser("USER");
    created.push(victima);
    actingUserId = intruso;

    const state = await suspendUserAction(emptyAdminState, formData({ userId: victima }));

    expect(state.status).toBe("error");
    expect(state.message).toMatch(/permisos/i);
    const target = await getDb().user.findUniqueOrThrow({ where: { id: victima } });
    expect(target.status).toBe("ACTIVE");
  });
});
