import type { ProgressViewModel } from "../model";
import { improvedProgressFixture } from "./improvedProgress.fixture";

/** Sin diferencia entre tramos: neutral, ni mejora ni retroceso. */
export const flatProgressFixture = {
  ...improvedProgressFixture,
  hero: {
    ...improvedProgressFixture.hero,
    stateText: "El resultado de este tramo es igual al del mismo tramo del mes anterior.",
    value: "312.000",
    valuePrefix: "$",
  },
  comparison: {
    ...improvedProgressFixture.comparison,
    rows: [
      {
        label: "Resultado del tramo anterior",
        supportingLabel: "24 días · 12 con registro",
        value: "312.000",
        valuePrefix: "$",
      },
      {
        kind: "with-status",
        label: "Resultado de este tramo",
        supportingLabel: "24 días · 12 con registro",
        status: "Igual que el anterior",
        value: "312.000",
        valuePrefix: "$",
        state: "default",
      },
      {
        label: "Diferencia entre tramos",
        supportingLabel: "Misma cantidad de días en los dos tramos",
        value: "0",
        valuePrefix: "$",
      },
    ],
    summary:
      "Los dos tramos cubren la misma cantidad de días, así que la diferencia de $0 no viene de comparar períodos desiguales.",
    summaryKind: "neutral",
  },
  stability: { ...improvedProgressFixture.stability, kind: "neutral" },
} satisfies ProgressViewModel;
