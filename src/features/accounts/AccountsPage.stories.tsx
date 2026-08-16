import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AccountForm } from "../../components/finance/AccountForm";
import { AccountDetail } from "./AccountDetail";
import { AccountMetadataForm } from "./AccountMetadataForm";
import { AccountsPage } from "./AccountsPage";
import { buildAccountsViewModel, type AccountViewInput } from "./model";

const account = (id: string, overrides: Partial<AccountViewInput> = {}): AccountViewInput => ({ id, name: "Banco principal", type: "BANK", currency: "ARS", status: "ACTIVE", liability: false, originalCents: 1_248_300_00n, valuedCents: 1_248_300_00n, ...overrides });
const accounts = [
  account("banco"),
  account("mp", { name: "Mercado Pago", type: "WALLET", originalCents: 248_300_00n, valuedCents: 248_300_00n }),
  account("cash", { name: "Efectivo", type: "CASH", originalCents: 0n, valuedCents: 0n }),
  account("usd", { name: "Ahorro dólares", type: "SAVINGS", currency: "USD", originalCents: 2_000_00n, valuedCents: 2_800_000_00n }),
  account("card", { name: "Visa Galicia", type: "CREDIT_CARD", liability: true, originalCents: -310_500_00n, valuedCents: -310_500_00n }),
  account("long", { name: "Cuenta con un nombre largo para verificar comportamiento", originalCents: 999_999_999_99n, valuedCents: 999_999_999_99n }),
  account("old", { name: "Banco anterior", status: "ARCHIVED", originalCents: 18_400_00n, valuedCents: 18_400_00n }),
];
const makeModel = (items: AccountViewInput[], complete = true) => buildAccountsViewModel({ displayCurrency: "ARS", displaySymbol: "$", complete, accounts: items });

const meta = { title: "V2/Cut 4/Accounts", component: AccountsPage, parameters: { layout: "fullscreen", nextjs: { appDirectory: true } }, args: { model: makeModel(accounts) } } satisfies Meta<typeof AccountsPage>;
export default meta;
type Story = StoryObj<typeof meta>;

export const MuchasCuentas: Story = {};
export const Normal: Story = { args: { model: makeModel(accounts.slice(0, 5)) } };
export const ImporteExtremo: Story = { args: { model: makeModel([account("extreme", { name: "Cuenta principal", originalCents: 1_001_496_599_99n, valuedCents: 1_001_496_599_99n })]) } };
export const ImporteMuyExtremo: Story = { args: { model: makeModel([account("very-extreme", { name: "Cuenta principal", originalCents: 98_765_432_109_87n, valuedCents: 98_765_432_109_87n })]) } };
export const NombreExtremo: Story = { args: { model: makeModel([account("long-name", { name: "Cuenta con un nombre deliberadamente muy largo para verificar que nunca destruya la columna del saldo", originalCents: 99_999_999_00n, valuedCents: 99_999_999_00n })]) } };
export const MuchasArchivadas: Story = { args: { model: makeModel(Array.from({ length: 12 }, (_, index) => account(`archived-${index}`, { name: `Cuenta archivada ${index + 1}`, status: "ARCHIVED", originalCents: BigInt((index + 1) * 18_400_00), valuedCents: BigInt((index + 1) * 18_400_00) }))) } };
export const UnaCuenta: Story = { args: { model: makeModel([accounts[0]!]) } };
export const SinCuentas: Story = { args: { model: makeModel([]) } };
export const TodasArchivadas: Story = { args: { model: makeModel([account("old", { status: "ARCHIVED" })]) } };
export const SinCotizacion: Story = { args: { model: makeModel(accounts, false) } };

export function DetalleCuenta() { return <div style={{ maxWidth: 1024, margin: "32px auto", padding: 20 }}><AccountDetail account={{ id: "mp", name: "Mercado Pago", typeLabel: "Billetera virtual", currency: "ARS", balance: "$248.300", status: "ACTIVE", liability: false, recent: [{ id: "m1", type: "EXPENSE", amount: "24.300", currency: "ARS", occurredOn: "2026-08-13", description: "Supermercado", accountName: "Mercado Pago", voided: false, corrected: false }] }} statusAction={<button>Archivar</button>} /></div>; }
export function DetalleTarjeta() { return <div style={{ maxWidth: 1024, margin: "32px auto", padding: 20 }}><AccountDetail account={{ id: "card", name: "Visa Galicia", typeLabel: "Tarjeta de crédito", currency: "ARS", balance: "−$310.500", status: "ACTIVE", liability: true, creditCard: { brand: "Visa", last4: "4321", closingDay: 20, dueDay: 10 }, recent: [] }} /></div>; }
export function DetalleArchivada() { return <div style={{ maxWidth: 1024, margin: "32px auto", padding: 20 }}><AccountDetail account={{ id: "old", name: "Banco anterior", typeLabel: "Banco", currency: "ARS", balance: "$18.400", status: "ARCHIVED", liability: false, recent: [] }} statusAction={<button>Reactivar</button>} /></div>; }
export function CrearCuenta() { return <div style={{ maxWidth: 720, margin: "32px auto", padding: 20 }}><AccountForm /></div>; }
export function EditarCuenta() { return <div style={{ maxWidth: 720, margin: "32px auto", padding: 20 }}><AccountMetadataForm account={{ id: "card", name: "Visa Galicia", typeLabel: "Tarjeta de crédito", currency: "ARS", creditCard: { brand: "Visa", last4: "4321", closingDay: 20, dueDay: 10 } }} /></div>; }
