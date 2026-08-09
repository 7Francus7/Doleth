import "server-only";
import { getDb } from "../../../lib/db";

/**
 * Lectura del padrón de usuarios para el panel de administración.
 *
 * Regla que define este módulo: **no lee un solo importe**. El panel existe para
 * administrar identidades —quién entró, quién quedó a mitad de camino, a quién
 * hay que darle de baja—, no para mirar la plata de la gente. Un administrador
 * que puede abrir el ledger de cualquiera convierte una app de finanzas en un
 * problema legal, y la tentación de agregar "sólo el saldo" aparece la primera
 * vez que alguien pide soporte. Por eso la restricción está acá, en el `select`,
 * y no en la disciplina de quien escriba la pantalla.
 *
 * Lo que sí se lee es actividad: cuántas cuentas y cuántos movimientos tiene.
 * Son números de uso, no de dinero, y son lo que permite distinguir a alguien
 * que se registró y nunca volvió de alguien que depende de esto todos los días.
 */

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  status: "PENDING_VERIFICATION" | "ACTIVE" | "SUSPENDED" | "DELETED";
  role: "USER" | "ADMIN";
  createdAt: Date;
  lastLoginAt: Date | null;
  emailVerifiedAt: Date | null;
  onboardingCompletedAt: Date | null;
  accountCount: number;
  movementCount: number;
}

export interface AdminUserPage {
  rows: AdminUserRow[];
  total: number;
  page: number;
  pageCount: number;
  query: string;
}

/** Cuántos usuarios entran en una pantalla sin volverla ilegible. */
export const ADMIN_PAGE_SIZE = 25;

export interface AdminUsersInput {
  /** Texto libre; se coteja contra nombre y correo. */
  query?: string;
  page?: number;
}

/**
 * Una página del padrón.
 *
 * Va paginado desde el primer día y no "cuando haga falta": el panel nace para
 * un producto con registro abierto, y una consulta sin límite funciona perfecto
 * con veinte usuarios y tumba la pantalla con veinte mil. Arreglarlo después
 * implica rehacer la pantalla entera.
 */
export async function getAdminUsers(input: AdminUsersInput = {}): Promise<AdminUserPage> {
  const db = getDb();
  const query = (input.query ?? "").trim();
  const requestedPage = Number.isSafeInteger(input.page) ? (input.page as number) : 1;

  const where = query
    ? {
        OR: [
          { email: { contains: query, mode: "insensitive" as const } },
          { name: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : {};

  const total = await db.user.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  // Pedir la página 400 de un padrón de tres no es un error que valga la pena
  // gritar: se muestra la última que existe.
  const page = Math.min(Math.max(1, requestedPage), pageCount);

  const users = await db.user.findMany({
    where,
    // Sin `select` explícito saldría también `passwordHash`. Esta lista es
    // exhaustiva a propósito: lo que no está acá no sale de la base.
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      role: true,
      createdAt: true,
      lastLoginAt: true,
      emailVerifiedAt: true,
      onboardingCompletedAt: true,
      _count: { select: { accounts: true, transactions: true } },
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * ADMIN_PAGE_SIZE,
    take: ADMIN_PAGE_SIZE,
  });

  return {
    rows: users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      role: user.role,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      emailVerifiedAt: user.emailVerifiedAt,
      onboardingCompletedAt: user.onboardingCompletedAt,
      accountCount: user._count.accounts,
      movementCount: user._count.transactions,
    })),
    total,
    page,
    pageCount,
    query,
  };
}

export interface AdminSummary {
  total: number;
  active: number;
  pending: number;
  suspended: number;
  /** Activos que además terminaron la configuración inicial. */
  onboarded: number;
  /** Altas de los últimos siete días. */
  recent: number;
}

/**
 * El encabezado del panel.
 *
 * Cuatro números que responden lo único que se pregunta al abrirlo: cuánta gente
 * hay, cuánta llegó a usar la app de verdad y cuánta quedó trabada en el camino.
 * `pending` es el que importa: una cifra que crece sola suele significar que los
 * correos de verificación no están llegando.
 */
export async function getAdminSummary(): Promise<AdminSummary> {
  const db = getDb();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [total, active, pending, suspended, onboarded, recent] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { status: "ACTIVE" } }),
    db.user.count({ where: { status: "PENDING_VERIFICATION" } }),
    db.user.count({ where: { status: "SUSPENDED" } }),
    db.user.count({ where: { status: "ACTIVE", onboardingCompletedAt: { not: null } } }),
    db.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
  ]);

  return { total, active, pending, suspended, onboarded, recent };
}
