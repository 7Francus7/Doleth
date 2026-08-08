export type NavIconName =
  | "home"
  | "activity"
  | "calendar"
  | "wallet"
  | "more"
  | "changes"
  | "progress"
  | "reality"
  | "act"
  | "investments"
  | "currency"
  | "import";

export interface Destination {
  href: string;
  label: string;
  /** Etiqueta corta para viewports muy angostos. */
  compact: string;
  icon: NavIconName;
  /** Descripción breve para el panel Más. */
  hint?: string;
}

export interface DestinationGroup {
  title: string;
  items: Destination[];
}

/** Destinos principales visibles en la barra inferior (3 enlaces + Registrar + Más = 5 slots reales). */
export const primaryDestinations: readonly [Destination, Destination, Destination] = [
  { href: "/ahora", label: "Ahora", compact: "Ahora", icon: "home" },
  { href: "/movimientos", label: "Movimientos", compact: "Movs.", icon: "activity" },
  { href: "/proximo", label: "Próximo", compact: "Pagos", icon: "calendar" },
];

/** Acción de registro. No es un destino de navegación: nunca se marca activo. */
export const registerAction = {
  href: "/movimientos/nuevo",
  label: "Registrar movimiento",
} as const;

/** Destinos secundarios, accesibles desde el panel Más, agrupados por intención. */
export const moreGroups: DestinationGroup[] = [
  {
    title: "Entender",
    items: [
      { href: "/cambios", label: "Cambios", compact: "Cambios", icon: "changes", hint: "Qué cambió respecto al período anterior." },
      { href: "/progreso", label: "Progreso", compact: "Progreso", icon: "progress", hint: "Cómo evolucionás mes a mes." },
      { href: "/mi-realidad", label: "Mi realidad", compact: "Realidad", icon: "reality", hint: "Tu situación financiera completa." },
      { href: "/actuar", label: "Actuar", compact: "Actuar", icon: "act", hint: "Decisiones sugeridas según tus datos." },
    ],
  },
  {
    title: "Organizar",
    items: [
      { href: "/cuentas", label: "Cuentas", compact: "Cuentas", icon: "wallet", hint: "Dónde está tu dinero." },
      { href: "/inversiones", label: "Inversiones", compact: "Inversiones", icon: "investments", hint: "Tu cartera y asignación." },
      { href: "/importar", label: "Importar", compact: "Importar", icon: "import", hint: "Subir el resumen del banco o la tarjeta." },
      { href: "/configuracion/moneda", label: "Moneda", compact: "Moneda", icon: "currency", hint: "Leer tu plata en pesos o en dólares." },
    ],
  },
];

export const secondaryDestinations: Destination[] = moreGroups.flatMap((group) => group.items);

/** Todas las superficies de producto que deben ser alcanzables desde la navegación. */
export const allProductSurfaces: string[] = [
  ...primaryDestinations.map((destination) => destination.href),
  ...secondaryDestinations.map((destination) => destination.href),
];

/**
 * ¿La ruta `href` es la superficie activa según el `pathname` actual?
 * Coincide con la ruta exacta o con cualquier subruta (`/cuentas` ⊇ `/cuentas/nueva`).
 */
export function isDestinationActive(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** ¿El panel Más debe mostrarse activo? Verdadero cuando el path pertenece a un destino secundario. */
export function isMoreActive(pathname: string): boolean {
  return secondaryDestinations.some((destination) => isDestinationActive(destination.href, pathname));
}
