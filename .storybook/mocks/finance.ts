export interface FinanceActionState {
  ok: boolean;
  message: string;
  detail?: string;
  error?: { code: string; field?: string };
}

const unavailableInStorybook = async (): Promise<FinanceActionState> => ({
  ok: false,
  message: "Las historias visuales no escriben datos.",
});

export const createMovementAction = unavailableInStorybook;
export const correctMovementAction = unavailableInStorybook;
export const createAccountAction = unavailableInStorybook;
export const updateAccountMetadataAction = unavailableInStorybook;
