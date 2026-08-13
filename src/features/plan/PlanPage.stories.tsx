import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { UpcomingCommitment } from "../../lib/finance/projection";
import { buildPlanModel } from "./model";
import { PlanPage } from "./PlanPage";

const TODAY = "2026-08-13";
const commitment = (id: string, concept: string, dueOn: string, amountCents: bigint, overrides: Partial<UpcomingCommitment> = {}): UpcomingCommitment => ({
  id, concept, dueOn, amountCents, accountId: "account-1", accountName: "Cuenta principal",
  accountBalanceCents: 1_200_000_00n, currency: "ARS", frequency: null, createdAtMs: Number(id.replace(/\D/g, "")) || 1,
  ...overrides,
});
const paid = [{ id: "paid-1", concept: "Seguro del auto", dueOn: "2026-08-12", amountCents: 78_900_00n, accountName: "Cuenta principal", currency: "ARS", transactionId: "tx-1" }];
const makeModel = (pending: UpcomingCommitment[], confirmed = paid) => buildPlanModel({ today: TODAY, horizon: 30, pending, paid: confirmed });
const many = [
  commitment("1", "Internet", "2026-08-10", 48_300_00n, { frequency: "Mensual" }),
  commitment("2", "Alquiler", TODAY, 495_000_00n, { frequency: "Mensual" }),
  commitment("3", "Electricidad", "2026-08-14", 62_500_00n),
  commitment("4", "Colegio", "2026-08-19", 180_000_00n, { frequency: "Mensual" }),
  commitment("5", "Hosting", "2026-08-29", 24_00n, { accountName: "Caja USD", currency: "USD", frequency: "Anual" }),
];

const meta = { title: "Features/Plan/Corte 5", component: PlanPage, args: { model: makeModel(many) }, parameters: { layout: "fullscreen" } } satisfies Meta<typeof PlanPage>;
export default meta;
type Story = StoryObj<typeof meta>;

export const MuchosPagos: Story = {};
export const Vacio: Story = { args: { model: makeModel([], []) } };
export const UnPago: Story = { args: { model: makeModel([many[2]!], []) } };
export const Vencido: Story = { args: { model: makeModel([many[0]!], []) } };
export const Hoy: Story = { args: { model: makeModel([many[1]!], []) } };
export const Realizado: Story = { args: { model: makeModel([], paid) } };
export const CuentaArchivada: Story = { args: { model: makeModel([commitment("6", "Servicio con cuenta no disponible", "2026-08-16", 32_000_00n, { accountName: "Cuenta archivada" })], []) } };
export const Multimoneda: Story = { args: { model: makeModel([many[1]!, many[4]!], []) } };
export const ImporteExtremo: Story = { args: { model: makeModel([commitment("7", "Compromiso extraordinario con un nombre deliberadamente largo", "2026-08-18", 9_999_999_999_99n)], []) } };
