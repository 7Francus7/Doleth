import "server-only";
import type { PrismaClient } from "../../generated/prisma/client";

/**
 * Baja de cuenta: borrado real, hecho por la propia persona.
 *
 * Por qué borrar y no anonimizar. Doleth no factura por movimiento ni tiene
 * contraparte que necesite conservar la contabilidad de alguien que se fue: los
 * datos financieros de una cuenta personal no le sirven a nadie más. Guardarlos
 * "por las dudas" convierte una baja en una promesa incumplida, así que la
 * aplicación destruye lo que muestra. Lo único que sobrevive es la bitácora
 * (`AuthEvent`), y sobrevive **sin persona**: su FK es SET NULL, de modo que
 * queda el hecho —una cuenta se dio de baja tal día— sin el sujeto.
 *
 * Por qué el borrado va escrito a mano y no por cascada. Todas las tablas
 * financieras declaran `onDelete: Restrict` contra `User` a propósito: una
 * cascada convierte cualquier `DELETE FROM "User"` accidental —un script de
 * mantenimiento, un `deleteMany` con el `where` equivocado— en la pérdida
 * silenciosa del ledger de alguien. Con RESTRICT, ese error falla en vez de
 * ejecutarse, y el único camino que borra finanzas es este, que dice
 * explícitamente qué borra y en qué orden.
 *
 * El orden no es estético: es el que exigen las claves foráneas compuestas
 * `(id, userId)`. Cada paso saca las filas que apuntan a las del paso siguiente.
 *
 * Todo ocurre en una sola transacción. Si algo falla, no queda una cuenta a
 * medio borrar: quedan las finanzas intactas y un error.
 */

/** Qué se borró, por tabla. Se usa para la bitácora y para las pruebas. */
export interface ErasureReport {
  importRows: number;
  importBatches: number;
  upcomingPayments: number;
  ledgerEntries: number;
  transactions: number;
  investments: number;
  creditCards: number;
  accounts: number;
  categories: number;
  manualRates: number;
  sessions: number;
  authTokens: number;
  privateBetaInvites: number;
}

/**
 * Borra todo lo que le pertenece al usuario y después al usuario mismo.
 *
 * Recibe el `PrismaClient` en lugar de tomarlo del módulo para que el
 * instrumental de operaciones (`prisma/ops/`) pueda usar exactamente el mismo
 * código que la aplicación, en vez de una segunda versión que se desincroniza.
 *
 * El `userId` viene siempre de la sesión validada contra la base. Esta función
 * no autoriza nada: quien la llama ya demostró ser el dueño.
 */
export async function eraseUserAccount(prisma: PrismaClient, userId: string): Promise<ErasureReport> {
  return prisma.$transaction(async (tx) => {
    // 1. Importaciones. Las filas apuntan a movimientos; los lotes, a cuentas.
    const importRows = await tx.importRow.deleteMany({ where: { userId } });
    const importBatches = await tx.importBatch.deleteMany({ where: { userId } });

    // 2. Pagos previstos. Pueden apuntar al movimiento que los confirmó.
    const upcomingPayments = await tx.upcomingPayment.deleteMany({ where: { userId } });

    // 3. Asientos, antes que los movimientos que los originan.
    const ledgerEntries = await tx.ledgerEntry.deleteMany({ where: { userId } });

    // 4. Movimientos. La cadena de correcciones es una FK a la propia tabla:
    //    hay que cortarla antes de borrar, o el orden de borrado importaría.
    await tx.transaction.updateMany({ where: { userId }, data: { correctedFromId: null } });
    const transactions = await tx.transaction.deleteMany({ where: { userId } });

    // 5. Lo que colgaba de las cuentas, y después las cuentas.
    const investments = await tx.investment.deleteMany({ where: { userId } });
    const creditCards = await tx.creditCard.deleteMany({ where: { userId } });
    const accounts = await tx.account.deleteMany({ where: { userId } });
    const categories = await tx.category.deleteMany({ where: { userId } });
    const manualRates = await tx.manualRate.deleteMany({ where: { userId } });

    // 6. Credenciales vivas. Se borran explícitamente aunque la cascada de
    //    `User` las alcanzaría: que ningún token ni sesión sobreviva al borrado
    //    no puede depender de un detalle del esquema que alguien podría cambiar.
    const sessions = await tx.session.deleteMany({ where: { userId } });
    const authTokens = await tx.authToken.deleteMany({ where: { userId } });

    // 7. Invitaciones emitidas por esta persona. Su FK es RESTRICT, así que sin
    //    esto un administrador que invitó a alguien no podría darse de baja.
    //    Las invitaciones que *consumió* se desvinculan solas (SET NULL).
    const privateBetaInvites = await tx.privateBetaInvite.deleteMany({ where: { createdById: userId } });

    // 8. La persona. Si algo quedó apuntando, RESTRICT hace fallar la
    //    transacción entera en vez de dejar la cuenta a medio borrar.
    await tx.user.delete({ where: { id: userId } });

    return {
      importRows: importRows.count,
      importBatches: importBatches.count,
      upcomingPayments: upcomingPayments.count,
      ledgerEntries: ledgerEntries.count,
      transactions: transactions.count,
      investments: investments.count,
      creditCards: creditCards.count,
      accounts: accounts.count,
      categories: categories.count,
      manualRates: manualRates.count,
      sessions: sessions.count,
      authTokens: authTokens.count,
      privateBetaInvites: privateBetaInvites.count,
    };
  });
}

/** Resumen corto y sin importes para la bitácora. Nunca lleva nombres ni montos. */
export function summarizeErasure(report: ErasureReport): string {
  const total =
    report.accounts + report.transactions + report.investments + report.upcomingPayments + report.categories;
  return `filas_borradas:${total}`;
}
