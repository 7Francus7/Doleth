/**
 * Catálogo base de categorías.
 *
 * Cada usuario recibe su propia copia al terminar el onboarding. Es una fila más
 * por categoría, pero mantiene una única regla de propiedad en todo el modelo
 * financiero (`where: { userId }`), sin excepciones ni categorías compartidas que
 * después haya que tratar distinto.
 */
export const DEFAULT_CATEGORIES = [
  { slug: "salary", name: "Sueldo", kind: "INCOME" },
  { slug: "freelance", name: "Trabajo independiente", kind: "INCOME" },
  { slug: "sales", name: "Ventas", kind: "INCOME" },
  { slug: "other-income", name: "Otros ingresos", kind: "INCOME" },
  { slug: "food", name: "Comida", kind: "EXPENSE" },
  { slug: "transport", name: "Transporte", kind: "EXPENSE" },
  { slug: "gym", name: "Gimnasio", kind: "EXPENSE" },
  { slug: "padel", name: "Pádel", kind: "EXPENSE" },
  { slug: "technology", name: "Tecnología", kind: "EXPENSE" },
  { slug: "services", name: "Servicios", kind: "EXPENSE" },
  { slug: "outings", name: "Salidas", kind: "EXPENSE" },
  { slug: "shopping", name: "Compras", kind: "EXPENSE" },
  { slug: "other-expense", name: "Otros gastos", kind: "EXPENSE" },
] as const satisfies readonly { slug: string; name: string; kind: "INCOME" | "EXPENSE" }[];

/** Categoría de respaldo al convertir un próximo pago en gasto real. */
export const FALLBACK_EXPENSE_SLUG = "other-expense";
