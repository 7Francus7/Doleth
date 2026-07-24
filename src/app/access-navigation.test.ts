import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

describe("navegación: superficies y estado activo", () => {
  const appNav = read("src/components/finance/AppNav.tsx");
  const moreMenu = read("src/components/finance/MoreMenu.tsx");

  it("AppNav se oculta en /ingresar", () => {
    expect(appNav).toContain('if (pathname === "/ingresar") return null;');
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

describe("acceso: /ingresar refinado sin tecnicismos", () => {
  const page = read("src/app/ingresar/page.tsx");
  const form = read("src/app/ingresar/LoginForm.tsx");
  const action = read("src/app/ingresar/actions.ts");

  it("muestra copy humano de producto privado", () => {
    expect(page).toContain("Entrá a Doleth");
    expect(page).toContain("Accedé a tu espacio financiero privado.");
    expect(page).toContain("Tus datos se usan únicamente para mostrarte tu situación financiera.");
    expect(page).toContain("La clave no coincide. Revisala e intentá nuevamente.");
  });

  it("no filtra términos técnicos al usuario", () => {
    for (const surface of [page, form]) {
      expect(surface).not.toContain("DOLETH_ACCESS_PASSWORD");
      expect(surface).not.toContain("DOLETH_SESSION_SECRET");
      expect(surface).not.toMatch(/\b401\b/);
      expect(surface).not.toContain("Unauthorized");
      expect(surface).not.toContain("token");
    }
  });

  it("el formulario cubre mostrar/ocultar, describe el campo, autocompleta y usa loading humano", () => {
    expect(form).toContain('autoComplete="current-password"');
    expect(form).toContain("aria-describedby={describedBy}");
    expect(form).toContain("aria-pressed={visible}");
    expect(form).toContain('loadingLabel="Verificando…"');
    expect(form).toContain('role="alert"');
  });

  it("deshabilita el submit cuando el campo está vacío (previene doble submit con loading)", () => {
    expect(form).toContain("disabled={value.trim().length === 0}");
    expect(form).toContain("const { pending } = useFormStatus();");
  });

  it("redirige a /ahora tras un acceso válido", () => {
    expect(action).toContain('redirect("/ahora")');
  });
});

describe("sesión: cierre seguro", () => {
  const session = read("src/app/actions/session.ts");
  const proxy = read("src/proxy.ts");

  it("cerrar sesión elimina la cookie y vuelve a /ingresar", () => {
    expect(session).toContain('store.delete("doleth_session")');
    expect(session).toContain('redirect("/ingresar")');
  });

  it('usa el copy "Cerrar sesión"', () => {
    expect(read("src/components/finance/MoreMenu.tsx")).toContain("Cerrar sesión");
  });

  it("el proxy protege las rutas privadas redirigiendo a /ingresar", () => {
    expect(proxy).toContain('new URL("/ingresar", request.url)');
    expect(proxy).toContain("verifyAccessToken");
  });
});

describe("continuidad: retorno y scroll", () => {
  const list = read("src/app/movimientos/page.tsx");
  const detail = read("src/app/movimientos/[id]/page.tsx");
  const restorer = read("src/components/finance/MovementList.tsx");

  it("la lista propaga el contexto de retorno en cada enlace de detalle", () => {
    expect(list).toContain("volver=${encodeURIComponent(listPath)}");
    expect(list).toContain("...(month !== currentMonth ? { month } : {})");
  });

  it("la lista restaura scroll con clave por URL normalizada", () => {
    expect(list).toContain("<MovementList className={styles.list} restorationKey={listPath}>");
    expect(restorer).toContain("scrollStorageKey(restorationKey)");
    expect(restorer).toContain('window.addEventListener("pagehide", onPageHide)');
  });

  it("el detalle sanea el retorno y ofrece volver a la lista", () => {
    expect(detail).toContain("sanitizeReturnPath(first((await searchParams).volver)");
    expect(detail).toContain("Volver a movimientos");
  });
});
