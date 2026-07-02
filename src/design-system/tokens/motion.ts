export const motionDuration = {
  micro: 0.12,
  numeric: 0.18,
  surface: 0.22,
  sheet: 0.28,
  reflow: 0.32,
} as const;

export const motionCurve = {
  snap: [0.22, 1, 0.36, 1],
  settle: [0.2, 0.8, 0.2, 1],
  exit: [0.4, 0, 0.2, 1],
} as const;

export const motionSequence = {
  state: 0,
  amount: motionDuration.micro,
  coverage: motionDuration.micro + motionDuration.numeric,
  stability: motionDuration.micro + motionDuration.numeric + motionDuration.surface,
} as const;
