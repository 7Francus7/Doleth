import type { Metadata } from "next";
import { CategoryCatalog, NewCategoryForm } from "../../../components/finance/CategorySettings";
import { OperationalShell } from "../../../components/finance/OperationalShell";
import { requireOnboardedUser } from "../../../lib/auth/guards";
import { getCategoryCatalog } from "../../../lib/finance/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Categorías · Doleth",
  robots: { index: false },
};

/**
 * El catálogo propio de categorías.
 *
 * Hasta acá Doleth repartía trece categorías iguales para todo el mundo y no
 * había forma de agregar una desde adentro. El resultado previsible es que todo
 * lo que no entraba en esa lista terminaba en "Otros gastos", y un reporte cuyo
 * rubro más grande se llama "otros" no responde la pregunta que lo justifica.
 *
 * La pantalla separa gasto de ingreso porque el selector del formulario también
 * los separa: una categoría de ingreso no aparece nunca al cargar un gasto, y
 * verlas mezcladas acá haría parecer un error lo que es la regla.
 */
export default async function CategoriesSettingsPage() {
  const user = await requireOnboardedUser("/configuracion/categorias");
  const categories = await getCategoryCatalog(user.id);

  return (
    <OperationalShell
      eyebrow="Tu vocabulario"
      title="Categorías"
      intro="Las categorías son las palabras con las que después vas a leer en qué se te fue la plata. Podés crear las tuyas, renombrarlas y archivar las que no usás."
    >
      <NewCategoryForm />
      <CategoryCatalog categories={categories} />
    </OperationalShell>
  );
}
