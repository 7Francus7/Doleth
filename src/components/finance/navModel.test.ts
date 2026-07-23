import { describe, expect, it } from "vitest";
import {
  allProductSurfaces,
  isDestinationActive,
  isMoreActive,
  moreGroups,
  primaryDestinations,
  registerAction,
  secondaryDestinations,
} from "./navModel";

describe("arquitectura de navegación", () => {
  it("expone todas las superficies de producto en algún lugar accesible", () => {
    for (const surface of ["/ahora", "/movimientos", "/proximo", "/cambios", "/progreso", "/mi-realidad", "/actuar", "/cuentas", "/inversiones"]) {
      expect(allProductSurfaces).toContain(surface);
    }
  });

  it("no supera cinco destinos principales en mobile (enlaces + Registrar + Más)", () => {
    const mobileSlots = primaryDestinations.length + 1 /* Registrar */ + 1 /* Más */;
    expect(mobileSlots).toBeLessThanOrEqual(5);
  });

  it("no duplica un destino entre principal y secundario", () => {
    const overlap = primaryDestinations.filter((primary) => secondaryDestinations.some((secondary) => secondary.href === primary.href));
    expect(overlap).toEqual([]);
  });

  it("Registrar apunta al formulario existente y no es un destino de navegación", () => {
    expect(registerAction.href).toBe("/movimientos/nuevo");
    expect(secondaryDestinations.some((destination) => destination.href === registerAction.href)).toBe(false);
    expect(primaryDestinations.some((destination) => destination.href === registerAction.href)).toBe(false);
  });

  it("cada item secundario tiene etiqueta de texto (no solo icono)", () => {
    for (const item of secondaryDestinations) {
      expect(item.label.trim().length).toBeGreaterThan(0);
    }
  });

  it("agrupa los secundarios en Entender y Organizar", () => {
    expect(moreGroups.map((group) => group.title)).toEqual(["Entender", "Organizar"]);
  });
});

describe("estado activo", () => {
  it("marca activa la ruta exacta y sus subrutas", () => {
    expect(isDestinationActive("/cuentas", "/cuentas")).toBe(true);
    expect(isDestinationActive("/cuentas", "/cuentas/nueva")).toBe(true);
  });

  it("no marca activa una ruta con prefijo parcial ajeno", () => {
    expect(isDestinationActive("/movimientos", "/movimientos-archivados")).toBe(false);
    expect(isDestinationActive("/ahora", "/ahora-antes")).toBe(false);
  });

  it("Más se marca activo en rutas secundarias y no en principales", () => {
    expect(isMoreActive("/cambios")).toBe(true);
    expect(isMoreActive("/inversiones")).toBe(true);
    expect(isMoreActive("/cuentas/nueva")).toBe(true);
    expect(isMoreActive("/ahora")).toBe(false);
    expect(isMoreActive("/movimientos")).toBe(false);
  });
});
