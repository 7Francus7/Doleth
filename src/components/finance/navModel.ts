export type NavIconName =
  | "home" | "activity" | "calendar" | "wallet" | "more" | "changes"
  | "progress" | "reality" | "act" | "investments" | "currency"
  | "import" | "spending" | "integrations";

export interface Destination {
  href: string;
  label: string;
  compact: string;
  icon: NavIconName;
  hint?: string;
}

export interface DestinationGroup { title: string; items: Destination[] }

/** Arquitectura primaria de V2. + Nuevo es una acción, no un sexto destino. */
export const primaryDestinations: readonly [Destination, Destination, Destination, Destination, Destination] = [
  { href: "/ahora", label: "Inicio", compact: "Inicio", icon: "home" },
  { href: "/movimientos", label: "Movimientos", compact: "Movs.", icon: "activity" },
  { href: "/cuentas", label: "Cuentas", compact: "Ctas.", icon: "wallet" },
  { href: "/proximo", label: "Plan", compact: "Plan", icon: "calendar" },
  { href: "/mi-realidad", label: "Patrimonio", compact: "Patrim.", icon: "reality" },
];

export const registerAction = { href: "/movimientos/nuevo", label: "+ Nuevo" } as const;

/** Superficies V1 y utilidades que siguen disponibles sin competir con la arquitectura primaria. */
export const moreGroups: DestinationGroup[] = [
  {
    title: "Análisis V1",
    items: [
      { href: "/en-que-se-fue", label: "En qué se fue", compact: "En qué", icon: "spending", hint: "Adónde fue tu plata este mes." },
      { href: "/cambios", label: "Cambios", compact: "Cambios", icon: "changes", hint: "Qué cambió respecto al período anterior." },
      { href: "/progreso", label: "Progreso", compact: "Progreso", icon: "progress", hint: "Cómo evolucionás mes a mes." },
      { href: "/actuar", label: "Actuar", compact: "Actuar", icon: "act", hint: "Decisiones sugeridas según tus datos." },
    ],
  },
  {
    title: "Configuración y datos",
    items: [
      { href: "/inversiones", label: "Inversiones", compact: "Inversiones", icon: "investments", hint: "Detalle de tu cartera y asignación." },
      { href: "/importar", label: "Importar", compact: "Importar", icon: "import", hint: "Subir el resumen del banco o la tarjeta." },
      { href: "/configuracion/moneda", label: "Moneda", compact: "Moneda", icon: "currency", hint: "Leer tu plata en pesos o en dólares." },
      { href: "/integraciones", label: "Integraciones", compact: "Conexiones", icon: "integrations", hint: "Traer cotizaciones y precios." },
    ],
  },
];

export const secondaryDestinations = moreGroups.flatMap((group) => group.items);
export const allProductSurfaces = [
  ...primaryDestinations.map((destination) => destination.href),
  ...secondaryDestinations.map((destination) => destination.href),
];

export function isDestinationActive(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isMoreActive(pathname: string): boolean {
  return secondaryDestinations.some((destination) => isDestinationActive(destination.href, pathname));
}
