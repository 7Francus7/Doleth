import Link from "next/link";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";
import { OperationalShell } from "../../components/finance/OperationalShell";
import { MovementDetail } from "./MovementDetail";
import { MovementsExplorer, type MovementsExplorerProps } from "./MovementsExplorer";
import type { MovementListItem } from "./model";

const accounts = [{ id: "banco", name: "Banco principal" }, { id: "mp", name: "Mercado Pago" }, { id: "efectivo", name: "Efectivo" }, { id: "usd", name: "Caja en dólares" }];
const categories = [{ id: "food", name: "Comida" }, { id: "transport", name: "Transporte" }, { id: "salary", name: "Sueldo" }, { id: "services", name: "Servicios" }];
const movement = (index: number, overrides: Partial<MovementListItem> = {}): MovementListItem => {
  const types = ["EXPENSE", "INCOME", "TRANSFER"] as const;
  const type = types[index % types.length] ?? "EXPENSE";
  return {
    id: `mov-${index}`, type, amount: index === 6 ? "999.999.999,99" : ["24.300", "310.000", "50.000"][index % 3] ?? "24.300",
    currency: "ARS", occurredOn: `2026-08-${String(13 - Math.floor(index / 3)).padStart(2, "0")}`,
    description: type === "EXPENSE" ? ["Supermercado", "Nafta", "Internet"][index % 3] ?? "Compra" : type === "INCOME" ? "Sueldo" : "Transferencia entre cuentas",
    categoryName: type === "EXPENSE" ? "Comida" : type === "INCOME" ? "Sueldo" : null,
    sourceAccountName: type === "EXPENSE" ? "Mercado Pago" : "Banco principal",
    destinationAccountName: type === "TRANSFER" ? "Efectivo" : null,
    voided: index === 7, corrected: index === 5, ...overrides,
  };
};
const movements = Array.from({ length: 24 }, (_, index) => movement(index));
const base: MovementsExplorerProps = { today: "2026-08-13", currentMonth: "2026-08", query: { month: "2026-08", page: 1 }, movements, accounts, categories, hasPrevious: false, hasNext: true, hasAnyMovements: true };

function Screen(props: MovementsExplorerProps) {
  return <OperationalShell actions={<Link href="/movimientos/nuevo">+ Registrar</Link>} eyebrow="Registro auditable" intro="Encontrá cada gasto, ingreso y transferencia." title="Movimientos" wide><MovementsExplorer {...props} /></OperationalShell>;
}

const meta = { title: "V2/Cut 3/Movements", component: Screen, parameters: { layout: "fullscreen", nextjs: { appDirectory: true } }, args: base } satisfies Meta<typeof Screen>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Historial: Story = {};
export const ListaGrande: Story = { args: { ...base, movements: Array.from({ length: 40 }, (_, index) => movement(index)), hasNext: true } };
export const Busqueda: Story = { args: { ...base, query: { month: "2026-08", q: "nafta", page: 1 }, movements: [movement(1, { description: "Nafta Axion", categoryName: "Transporte" })], hasNext: false } };
export const SinResultados: Story = { args: { ...base, query: { month: "2026-08", q: "nafta", page: 1 }, movements: [], hasNext: false } };
export const FiltrosCombinados: Story = { args: { ...base, query: { month: "2026-07", type: "EXPENSE", accountId: "mp", categoryId: "food", min: "10.000", max: "100.000", page: 1 }, movements: [movement(0)], hasNext: false } };
export const SinMovimientos: Story = { args: { ...base, movements: [], hasAnyMovements: false, hasNext: false } };
export const PeriodoVacio: Story = { args: { ...base, query: { month: "2026-07", page: 1 }, movements: [], hasNext: false } };
export const FiltrosMobile: Story = { play: async ({ canvasElement }) => { await userEvent.click(within(canvasElement).getByRole("button", { name: "Filtros" })); } };

export function Detalle() { return <div style={{ maxWidth: 1024, margin: "32px auto", padding: 20 }}><MovementDetail actions={<><a href="#corregir">Corregir</a><a href="#repetir">Repetir</a></>} movement={{ type: "EXPENSE", amount: "24.300", currency: "ARS", date: "Hoy", description: "Supermercado", category: "Comida", sourceAccount: "Mercado Pago", voided: false }} /></div>; }
export function DetalleTransferencia() { return <div style={{ maxWidth: 1024, margin: "32px auto", padding: 20 }}><MovementDetail movement={{ type: "TRANSFER", amount: "50.000", currency: "ARS", date: "Ayer", sourceAccount: "Banco principal", destinationAccount: "Caja en dólares", destinationAmount: "USD 47,50", voided: false }} /></div>; }
export function DetalleAnulado() { return <div style={{ maxWidth: 1024, margin: "32px auto", padding: 20 }}><MovementDetail movement={{ type: "EXPENSE", amount: "18.500", currency: "ARS", date: "11 ago", description: "Almuerzo", category: "Comida", sourceAccount: "Mercado Pago", voided: true, voidReason: "Importe duplicado", correction: <a href="#reemplazo">Ver reemplazo</a> }} /></div>; }
