import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import type { EmailMessage } from "../../../lib/auth/email";
import { deleteTestUser, formData, hasDatabase } from "../../../test/fixtures";

/**
 * Gestión de la cuenta: reautenticación, sesiones y baja.
 *
 * Igual que en los flujos públicos, sólo se sustituyen las fronteras del
 * framework y el envío de correo. La sesión es real: se crea con `createSession`
 * y se valida contra la tabla `Session`.
 */

const cookieJar = new Map<string, { value: string }>();
const sentEmails: EmailMessage[] = [];

vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));
vi.mock("next/navigation", () => ({
  redirect: (destination: string) => {
    throw new Error(`REDIRECT:${destination}`);
  },
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => cookieJar.get(name),
    set: (name: string, value: string) => cookieJar.set(name, { value }),
    delete: (name: string) => cookieJar.delete(name),
    has: (name: string) => cookieJar.has(name),
  }),
  headers: async () => new Headers({ "user-agent": "vitest", "x-forwarded-for": "203.0.113.10" }),
}));
vi.mock("../../../lib/auth/email", async () => {
  const actual = await vi.importActual<typeof import("../../../lib/auth/email")>("../../../lib/auth/email");
  return {
    ...actual,
    sendEmail: async (message: EmailMessage) => {
      sentEmails.push(message);
    },
  };
});

const {
  changePasswordAction,
  confirmEmailChangeAction,
  requestAccountDeletionAction,
  requestEmailChangeAction,
  revokeOtherSessionsAction,
  updateProfileAction,
} = await import("./actions");
const { emptyAccountState } = await import("../../../lib/auth/form-state");
const { createSession, getSession, revokeUserSessions } = await import("../../../lib/auth/session");
const { hashPassword, verifyPassword } = await import("../../../lib/auth/password");
const { getDb } = await import("../../../lib/db");

const PASSWORD = "melon tranquilo 2026";
const createdUserIds: string[] = [];

async function createSignedInUser(label: string) {
  const email = `${label}-${randomUUID()}@pruebas.doleth.local`;
  const user = await getDb().user.create({
    data: {
      name: "Persona de prueba",
      email,
      passwordHash: await hashPassword(PASSWORD),
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      onboardingStep: 3,
      onboardingCompletedAt: new Date(),
    },
  });
  createdUserIds.push(user.id);
  cookieJar.clear();
  await createSession(user.id);
  return user;
}

describe.skipIf(!hasDatabase)("acciones de la cuenta", () => {
  beforeEach(() => {
    sentEmails.length = 0;
    cookieJar.clear();
  });

  afterAll(async () => {
    for (const id of createdUserIds) await deleteTestUser(id).catch(() => undefined);
  });

  // -------------------------------------------------------------------------
  describe("sesión", () => {
    it("una sesión revocada deja de resolver aunque la cookie siga en el navegador", async () => {
      const user = await createSignedInUser("sesion-revocada");
      expect((await getSession())?.user.id).toBe(user.id);

      await revokeUserSessions(user.id);
      expect(await getSession()).toBeNull();
      // La cookie sigue presente: la validación es de servidor, no de navegador.
      expect(cookieJar.has("doleth_session")).toBe(true);
    });

    it("una sesión vencida deja de resolver", async () => {
      const user = await createSignedInUser("sesion-vencida");
      await getDb().session.updateMany({
        where: { userId: user.id },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });
      expect(await getSession()).toBeNull();
    });

    it("suspender la cuenta corta el acceso de inmediato", async () => {
      const user = await createSignedInUser("sesion-suspendida");
      await getDb().user.update({ where: { id: user.id }, data: { status: "SUSPENDED" } });
      expect(await getSession()).toBeNull();
    });

    it("la base guarda el hash del token, nunca el token de la cookie", async () => {
      const user = await createSignedInUser("sesion-hash");
      const cookie = cookieJar.get("doleth_session")?.value ?? "";
      const token = cookie.split(".")[1] ?? "";
      const sesion = await getDb().session.findFirstOrThrow({ where: { userId: user.id } });
      expect(token.length).toBeGreaterThan(20);
      expect(sesion.tokenHash).not.toBe(token);
      expect(sesion.tokenHash).toHaveLength(64);
    });

    it("cerrar otras sesiones conserva la actual", async () => {
      const user = await createSignedInUser("sesion-otras");
      const propia = (await getSession())!.sessionId;
      // Dos sesiones más, como si hubiera entrado desde otros dispositivos.
      const otroNavegador = new Map(cookieJar);
      await createSession(user.id);
      await createSession(user.id);
      cookieJar.clear();
      for (const [key, value] of otroNavegador) cookieJar.set(key, value);

      const estado = await revokeOtherSessionsAction();
      expect(estado.status).toBe("success");
      const vivas = await getDb().session.findMany({ where: { userId: user.id, revokedAt: null } });
      expect(vivas.map((sesion) => sesion.id)).toEqual([propia]);
      expect((await getSession())?.sessionId).toBe(propia);
    });
  });

  // -------------------------------------------------------------------------
  describe("cambio de contraseña", () => {
    it("exige la contraseña actual", async () => {
      await createSignedInUser("password-reauth");
      const estado = await changePasswordAction(
        emptyAccountState,
        formData({
          currentPassword: "clave equivocada 123",
          password: "sandia despierta 4040",
          passwordConfirmation: "sandia despierta 4040",
        }),
      );
      expect(estado.status).toBe("error");
      expect(estado.errors.currentPassword).toBeDefined();
    });

    it("cambia la contraseña, cierra las demás sesiones y mantiene la propia", async () => {
      const user = await createSignedInUser("password-ok");
      const propia = (await getSession())!.sessionId;
      const otroNavegador = new Map(cookieJar);
      await createSession(user.id);
      cookieJar.clear();
      for (const [key, value] of otroNavegador) cookieJar.set(key, value);

      const nueva = "sandia despierta 4040";
      const estado = await changePasswordAction(
        emptyAccountState,
        formData({ currentPassword: PASSWORD, password: nueva, passwordConfirmation: nueva }),
      );
      expect(estado.status).toBe("success");

      const actualizado = await getDb().user.findUniqueOrThrow({ where: { id: user.id } });
      expect((await verifyPassword(nueva, actualizado.passwordHash)).valid).toBe(true);
      expect((await verifyPassword(PASSWORD, actualizado.passwordHash)).valid).toBe(false);

      const vivas = await getDb().session.findMany({ where: { userId: user.id, revokedAt: null } });
      expect(vivas.map((sesion) => sesion.id)).toEqual([propia]);
      expect((await getSession())?.sessionId).toBe(propia);
      expect(sentEmails.at(-1)?.subject).toMatch(/contraseña/i);
    });

    it("rechaza repetir la contraseña actual", async () => {
      await createSignedInUser("password-igual");
      const estado = await changePasswordAction(
        emptyAccountState,
        formData({ currentPassword: PASSWORD, password: PASSWORD, passwordConfirmation: PASSWORD }),
      );
      expect(estado.status).toBe("error");
    });

    it("las sesiones anteriores al cambio ya no sirven en otro navegador", async () => {
      const user = await createSignedInUser("password-invalida-viejas");
      const otroNavegador = new Map(cookieJar);
      await createSession(user.id);
      const cookieNueva = new Map(cookieJar);

      cookieJar.clear();
      for (const [key, value] of otroNavegador) cookieJar.set(key, value);
      const nueva = "sandia despierta 4040";
      await changePasswordAction(
        emptyAccountState,
        formData({ currentPassword: PASSWORD, password: nueva, passwordConfirmation: nueva }),
      );

      cookieJar.clear();
      for (const [key, value] of cookieNueva) cookieJar.set(key, value);
      expect(await getSession()).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  describe("cambio de correo", () => {
    it("exige la contraseña actual y no cambia nada sin confirmar", async () => {
      const user = await createSignedInUser("email-reauth");
      const nuevo = `nuevo-${randomUUID()}@pruebas.doleth.local`;

      const sinPassword = await requestEmailChangeAction(
        emptyAccountState,
        formData({ newEmail: nuevo, currentPassword: "clave equivocada 123" }),
      );
      expect(sinPassword.status).toBe("error");

      const conPassword = await requestEmailChangeAction(
        emptyAccountState,
        formData({ newEmail: nuevo, currentPassword: PASSWORD }),
      );
      expect(conPassword.status).toBe("success");

      // Hasta confirmar, el correo de acceso sigue siendo el viejo.
      expect((await getDb().user.findUniqueOrThrow({ where: { id: user.id } })).email).toBe(user.email);
      // Se avisa a la dirección nueva y también a la anterior.
      expect(sentEmails.map((correo) => correo.to)).toEqual(expect.arrayContaining([nuevo, user.email]));
    });

    it("al confirmar el token, el acceso pasa a la dirección nueva", async () => {
      const user = await createSignedInUser("email-confirma");
      const nuevo = `nuevo-${randomUUID()}@pruebas.doleth.local`;
      await requestEmailChangeAction(
        emptyAccountState,
        formData({ newEmail: nuevo, currentPassword: PASSWORD }),
      );

      const correo = sentEmails.find((mensaje) => mensaje.to === nuevo);
      const token = decodeURIComponent(correo?.text.match(/token=([\w-]+)/)?.[1] ?? "");
      expect(token).not.toBe("");

      const estado = await confirmEmailChangeAction(emptyAccountState, formData({ token }));
      expect(estado.status).toBe("success");
      expect((await getDb().user.findUniqueOrThrow({ where: { id: user.id } })).email).toBe(nuevo);

      // Un segundo uso del mismo enlace no hace nada.
      expect((await confirmEmailChangeAction(emptyAccountState, formData({ token }))).status).toBe("error");
    });

    it("un token de cambio de otra persona no se puede usar", async () => {
      const ajeno = await createSignedInUser("email-ajeno");
      const nuevo = `nuevo-${randomUUID()}@pruebas.doleth.local`;
      await requestEmailChangeAction(emptyAccountState, formData({ newEmail: nuevo, currentPassword: PASSWORD }));
      const token = decodeURIComponent(
        sentEmails.find((mensaje) => mensaje.to === nuevo)?.text.match(/token=([\w-]+)/)?.[1] ?? "",
      );

      const victima = await createSignedInUser("email-victima");
      const estado = await confirmEmailChangeAction(emptyAccountState, formData({ token }));
      expect(estado.status).toBe("error");
      expect((await getDb().user.findUniqueOrThrow({ where: { id: victima.id } })).email).toBe(victima.email);
      expect((await getDb().user.findUniqueOrThrow({ where: { id: ajeno.id } })).email).toBe(ajeno.email);

      cookieJar.clear();
      await createSession(ajeno.id);
      const confirmacionLegitima = await confirmEmailChangeAction(emptyAccountState, formData({ token }));
      expect(confirmacionLegitima.status).toBe("success");
      expect((await getDb().user.findUniqueOrThrow({ where: { id: ajeno.id } })).email).toBe(nuevo);
    });
  });

  // -------------------------------------------------------------------------
  describe("perfil y baja", () => {
    it("guarda nombre y preferencias válidas", async () => {
      const user = await createSignedInUser("perfil");
      const estado = await updateProfileAction(
        emptyAccountState,
        formData({
          name: "Francisco",
          primaryCurrency: "ARS",
          timeZone: "America/Argentina/Cordoba",
          locale: "es-AR",
        }),
      );
      expect(estado.status).toBe("success");
      const actualizado = await getDb().user.findUniqueOrThrow({ where: { id: user.id } });
      expect(actualizado.name).toBe("Francisco");
      expect(actualizado.timeZone).toBe("America/Argentina/Cordoba");
    });

    it("rechaza una zona horaria fuera de la lista", async () => {
      await createSignedInUser("perfil-zona");
      const estado = await updateProfileAction(
        emptyAccountState,
        formData({
          name: "Francisco",
          primaryCurrency: "ARS",
          timeZone: "Marte/Olympus",
          locale: "es-AR",
        }),
      );
      expect(estado.errors.timeZone).toBeDefined();
    });

    it("la baja exige contraseña y la frase de confirmación, y no borra datos", async () => {
      const user = await createSignedInUser("baja");
      await getDb().account.create({
        data: { userId: user.id, name: "Cuenta que no se borra", type: "BANK", initialBalanceCents: 1000n },
      });

      const sinFrase = await requestAccountDeletionAction(
        emptyAccountState,
        formData({ currentPassword: PASSWORD, confirmation: "eliminar" }),
      );
      expect(sinFrase.errors.confirmation).toBeDefined();

      const sinPassword = await requestAccountDeletionAction(
        emptyAccountState,
        formData({ currentPassword: "clave equivocada 123", confirmation: "ELIMINAR" }),
      );
      expect(sinPassword.errors.currentPassword).toBeDefined();

      const correcta = await requestAccountDeletionAction(
        emptyAccountState,
        formData({ currentPassword: PASSWORD, confirmation: "ELIMINAR" }),
      );
      expect(correcta.status).toBe("success");

      const actualizado = await getDb().user.findUniqueOrThrow({ where: { id: user.id } });
      expect(actualizado.deletionRequestedAt).not.toBeNull();
      // El pedido queda registrado; los datos siguen ahí. No decimos que borramos.
      expect(actualizado.status).toBe("ACTIVE");
      expect(await getDb().account.count({ where: { userId: user.id } })).toBe(1);
    });
  });
});
