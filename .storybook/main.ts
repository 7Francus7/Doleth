import type { StorybookConfig } from "@storybook/nextjs-vite";
import { fileURLToPath } from "node:url";

const storybookActionMock = fileURLToPath(new URL("./mocks/finance.ts", import.meta.url));

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: ["@storybook/addon-a11y"],
  framework: {
    name: "@storybook/nextjs-vite",
    options: {},
  },
  viteFinal: async (config) => ({
    ...config,
    resolve: {
      ...config.resolve,
      alias: [
        ...(Array.isArray(config.resolve?.alias) ? config.resolve.alias : []),
        {
          find: "../../app/actions/finance",
          replacement: storybookActionMock,
        },
        {
          find: /[\\/]src[\\/]app[\\/]actions[\\/]finance(?:\.ts)?$/,
          replacement: storybookActionMock,
        },
      ],
    },
  }),
};

export default config;
