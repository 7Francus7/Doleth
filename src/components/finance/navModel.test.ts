import { describe, expect, it } from "vitest";
import { allProductSurfaces, isDestinationActive, isMoreActive, moreGroups, primaryDestinations, registerAction, secondaryDestinations } from "./navModel";

describe("arquitectura de navegación V2", () => {
  it("mantiene todas las superficies de producto accesibles", () => {
    for (const surface of ["/ahora", "/movimientos", "/proximo", "/cambios", "/progreso", "/mi-realidad", "/actuar", "/cuentas", "/inversiones"]) {
      expect(allProductSurfaces).toContain(surface);
    }
  });

  it("expone exactamente cinco destinos principales", () => {
    expect(primaryDestinations).toHaveLength(5);
    expect(primaryDestinations.map((destination) => destination.label)).toEqual([
      "Inicio", "Movimientos", "Cuentas", "Plan", "Patrimonio",
    ]);
  });

  it("no duplica destinos entre arquitectura primaria y secundaria", () => {
    const overlap = primaryDestinations.filter((primary) => secondaryDestinations.some((secondary) => secondary.href === primary.href));
    expect(overlap).toEqual([]);
  });

  it("Nuevo apunta al formulario existente y no es un destino", () => {
    expect(registerAction.href).toBe("/movimientos/nuevo");
    expect(allProductSurfaces).not.toContain(registerAction.href);
  });

  it("retira análisis V1 y utilidades a grupos secundarios", () => {
    expect(moreGroups.map((group) => group.title)).toEqual(["Análisis V1", "Configuración y datos"]);
    for (const item of secondaryDestinations) expect(item.label.trim()).not.toBe("");
  });
});

describe("estado activo", () => {
  it("marca ruta exacta y subrutas sin aceptar prefijos parciales", () => {
    expect(isDestinationActive("/cuentas", "/cuentas/nueva")).toBe(true);
    expect(isDestinationActive("/ahora", "/ahora-antes")).toBe(false);
  });

  it("Más sólo se activa en superficies secundarias", () => {
    expect(isMoreActive("/cambios")).toBe(true);
    expect(isMoreActive("/inversiones")).toBe(true);
    expect(isMoreActive("/cuentas/nueva")).toBe(false);
    expect(isMoreActive("/ahora")).toBe(false);
  });
});
