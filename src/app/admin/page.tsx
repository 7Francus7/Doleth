import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "../../lib/auth/guards";
import { getAdminSummary, getAdminUsers } from "../../features/admin/data/getAdminUsers";
import { AdminUserActions } from "./AdminUserActions";
import styles from "./admin.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Administración · Doleth",
  robots: { index: false },
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Activa",
  PENDING_VERIFICATION: "Sin verificar",
  SUSPENDED: "Suspendida",
  DELETED: "Dada de baja",
};

/** Estado del que depende el tono de la fila: sólo tres importan visualmente. */
const STATUS_TONE: Record<string, string> = {
  ACTIVE: "stable",
  PENDING_VERIFICATION: "attention",
  SUSPENDED: "critical",
  DELETED: "muted",
};

function formatDay(value: Date | null, locale: string, timeZone: string): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric", timeZone })
    .format(value);
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ buscar?: string; pagina?: string }>;
}) {
  const admin = await requireAdmin("/admin");
  const params = await searchParams;
  const query = (params.buscar ?? "").trim();
  const page = Number.parseInt(params.pagina ?? "1", 10);

  const [summary, padron] = await Promise.all([
    getAdminSummary(),
    getAdminUsers({ query, page: Number.isNaN(page) ? 1 : page }),
  ]);

  const day = (value: Date | null) => formatDay(value, admin.locale, admin.timeZone);

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Administración</p>
        <h1 className={styles.title}>
          {summary.total === 1 ? "Hay una cuenta creada" : `Hay ${summary.total} cuentas creadas`}
        </h1>
        <p className={styles.lede}>
          {summary.onboarded === 0
            ? "Todavía nadie terminó de configurar Doleth."
            : `${summary.onboarded} terminaron la configuración y ${summary.recent} se sumaron esta semana.`}
        </p>
      </header>

      <section aria-label="Resumen" className={styles.summary}>
        <p className={styles.metric}>
          <span className={styles.metricValue}>{summary.active}</span>
          <span className={styles.metricLabel}>Activas</span>
        </p>
        <p className={styles.metric} data-tone={summary.pending > 0 ? "attention" : undefined}>
          <span className={styles.metricValue}>{summary.pending}</span>
          <span className={styles.metricLabel}>Sin verificar</span>
        </p>
        <p className={styles.metric} data-tone={summary.suspended > 0 ? "critical" : undefined}>
          <span className={styles.metricValue}>{summary.suspended}</span>
          <span className={styles.metricLabel}>Suspendidas</span>
        </p>
      </section>

      {summary.pending > 0 ? (
        <p className={styles.notice}>
          Las cuentas sin verificar no pueden entrar. Si este número crece solo, revisá que los correos de
          verificación estén saliendo.
        </p>
      ) : null}

      <form action="/admin" className={styles.search} role="search">
        <label className={styles.searchLabel} htmlFor="buscar">
          Buscar por nombre o correo
        </label>
        <input
          autoComplete="off"
          className={styles.searchInput}
          defaultValue={query}
          id="buscar"
          name="buscar"
          placeholder="nombre o correo"
          type="search"
        />
        <button className={styles.searchSubmit} type="submit">
          Buscar
        </button>
      </form>

      {padron.rows.length === 0 ? (
        <p className={styles.empty}>
          {query ? `Ninguna cuenta coincide con “${query}”.` : "Todavía no hay ninguna cuenta."}
        </p>
      ) : (
        <ul className={styles.list}>
          {padron.rows.map((row) => (
            <li className={styles.row} data-tone={STATUS_TONE[row.status]} key={row.id}>
              <div className={styles.identity}>
                <p className={styles.name}>{row.name}</p>
                <p className={styles.email}>{row.email}</p>
              </div>

              <p className={styles.badges}>
                <span className={styles.badge} data-tone={STATUS_TONE[row.status]}>
                  {STATUS_LABELS[row.status] ?? row.status}
                </span>
                {row.role === "ADMIN" ? <span className={styles.badge} data-tone="accent">Admin</span> : null}
                {row.status === "ACTIVE" && !row.onboardingCompletedAt ? (
                  <span className={styles.badge}>Sin configurar</span>
                ) : null}
              </p>

              <dl className={styles.meta}>
                <div>
                  <dt>Alta</dt>
                  <dd>{day(row.createdAt)}</dd>
                </div>
                <div>
                  <dt>Última sesión</dt>
                  <dd>{day(row.lastLoginAt)}</dd>
                </div>
                <div>
                  <dt>Cuentas</dt>
                  <dd>{row.accountCount}</dd>
                </div>
                <div>
                  <dt>Movimientos</dt>
                  <dd>{row.movementCount}</dd>
                </div>
              </dl>

              <AdminUserActions
                isSelf={row.id === admin.id}
                role={row.role}
                status={row.status}
                userId={row.id}
              />
            </li>
          ))}
        </ul>
      )}

      {padron.pageCount > 1 ? (
        <nav aria-label="Paginación" className={styles.pagination}>
          {padron.page > 1 ? (
            <Link
              href={{ pathname: "/admin", query: { ...(query ? { buscar: query } : {}), pagina: padron.page - 1 } }}
            >
              Anterior
            </Link>
          ) : (
            <span aria-disabled="true">Anterior</span>
          )}
          <span className={styles.paginationState}>
            Página {padron.page} de {padron.pageCount}
          </span>
          {padron.page < padron.pageCount ? (
            <Link
              href={{ pathname: "/admin", query: { ...(query ? { buscar: query } : {}), pagina: padron.page + 1 } }}
            >
              Siguiente
            </Link>
          ) : (
            <span aria-disabled="true">Siguiente</span>
          )}
        </nav>
      ) : null}

      <p className={styles.footnote}>
        Este panel administra cuentas, no dinero. Doleth no te muestra los saldos, los movimientos ni las
        inversiones de nadie, y no hay forma de llegar a ellos desde acá.
      </p>
    </main>
  );
}
