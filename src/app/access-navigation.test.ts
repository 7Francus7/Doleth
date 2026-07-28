import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

describe("navegación: superficies y estado activo", () => {
  const appNav = read("src/components/finance/AppNav.tsx");
  const moreMenu = read("src/components/finance/MoreMenu.tsx");

  it("AppNav se oculta en todas las pantallas sin sesión útil", () => {
    expect(appNav).toContain("if (HIDDEN_ON.has(pathname)) return null;");
    for (const path of ["/ingresar", "/iniciar-sesion", "/crear-cuenta", "/onboarding", "/privacidad"]) {
      expect(appNav, path).toContain(`"${path}"`);
    }
  });

  it("AppNav usa enlaces reales y aria-current en destinos", () => {
    expect(appNav).toContain("import Link from \"next/link\";");
    expect(appNav).toContain('aria-current={isDestinationActive(destination.href, pathname) ? "page" : undefined}');
  });

  it("AppNav incluye Registrar y el panel Más", () => {
    expect(appNav).toContain("registerAction.href");
    expect(appNav).toContain("<MoreMenu />");
  });

  it("Más expone estado expandido, controla el panel y marca activo en rutas secundarias", () => {
    expect(moreMenu).toContain("aria-expanded={open}");
    expect(moreMenu).toContain('aria-controls="more-panel"');
    expect(moreMenu).toContain('aria-haspopup="dialog"');
    expect(moreMenu).toContain('aria-current={active ? "page" : undefined}');
    expect(moreMenu).toContain("isMoreActive(pathname)");
  });

  it("Más usa BottomSheet (Escape, backdrop y retorno de foco) y enlaces reales que cierran al navegar", () => {
    expect(moreMenu).toContain("BottomSheet");
    expect(moreMenu).toContain("returnFocusRef={triggerRef}");
    expect(moreMenu).toContain("import Link from \"next/link\";");
    expect(moreMenu).toContain("onClick={() => setOpen(false)}");
  });
});

describe("acceso: la clave única de un solo usuario ya no existe", () => {
  const legacyPage = read("src/app/ingresar/page.tsx");
  const form = read("src/components/auth/LoginForm.tsx");

  it("/ingresar quedó como redirección al login real", () => {
    expect(legacyPage).toContain('redirect("/iniciar-sesion")');
  });

  it("no queda rastro de la clave compartida en las superficies de acceso", () => {
    for (const surface of [legacyPage, form]) {
      expect(surface).not.toContain("DOLETH_ACCESS_PASSWORD");
      expect(surface).not.toContain("DOLETH_SESSION_SECRET");
      expect(surface).not.toMatch(/\b401\b/);
      expect(surface).not.toContain("Unauthorized");
    }
  });

  it("el login pide correo y contraseña, autocompleta y anuncia el error", () => {
    expect(form).toContain('autoComplete="email"');
    expect(form).toContain('autoComplete="current-password"');
    expect(form).toContain('role="alert"');
    expect(form).toContain('pendingLabel="Entrando…"');
  });

  it("ofrece recuperación y alta desde el mismo lugar", () => {
    expect(form).toContain('href="/olvide-mi-contrasena"');
    expect(form).toContain('href="/crear-cuenta"');
  });
});

describe("sesión: cierre seguro", () => {
  const authActions = read("src/app/auth/actions.ts");
  const moreMenu = read("src/components/finance/MoreMenu.tsx");
  const proxy = read("src/proxy.ts");

  it("cerrar sesión revoca la sesión en la base, no sólo la cookie", () => {
    expect(authActions).toContain("destroyCurrentSession()");
    expect(authActions).toContain('redirect("/iniciar-sesion")');
    expect(authActions).toContain('type: "LOGOUT"');
  });

  it("el menú usa el cierre de sesión con revocación", () => {
    expect(moreMenu).toContain('from "../../app/auth/actions"');
    expect(moreMenu).toContain("Cerrar sesión");
  });

  it("el proxy protege las rutas privadas mandando al login", () => {
    expect(proxy).toContain('new URL("/iniciar-sesion", request.url)');
    expect(proxy).toContain("openSessionCookie");
  });
});

describe("continuidad: retorno y scroll", () => {
  const list = read("src/app/movimientos/page.tsx");
  const detail = read("src/app/movimientos/[id]/page.tsx");
  const restorer = read("src/components/finance/RestorableList.tsx");

  it("la lista propaga el contexto de retorno en cada enlace de detalle", () => {
    expect(list).toContain("volver=${encodeURIComponent(listPath)}");
    expect(list).toContain("...(month !== currentMonth ? { month } : {})");
  });

  it("la lista restaura scroll con clave por URL normalizada", () => {
    expect(list).toContain("<RestorableList className={styles.list} restorationKey={listPath}>");
    expect(restorer).toContain("scrollStorageKey(restorationKey)");
    expect(restorer).toContain('window.addEventListener("pagehide", onPageHide)');
  });

  it("el detalle sanea el retorno y ofrece volver a la lista", () => {
    expect(detail).toContain("sanitizeReturnPath(first((await searchParams).volver)");
    expect(detail).toContain("Volver a movimientos");
  });
});
