/**
 * Forma del recorrido de configuración inicial.
 *
 * Vive fuera de `app/onboarding/actions.ts` porque ese archivo es `"use server"`
 * y un módulo de acciones sólo puede exportar funciones async: una constante
 * exportada ahí compila en los tests y rompe el build, que es la peor forma de
 * enterarse. Acá además queda accesible desde el cliente sin arrastrar las
 * acciones.
 */

/** Cuántos pasos completados marcan el final del recorrido. */
export const ONBOARDING_STEPS = 5;

/** Cuántos gastos fijos se piden de entrada. Tres alcanzan para el alquiler y dos servicios. */
export const FIXED_EXPENSE_SLOTS = 3;
