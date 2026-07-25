import type { Preview } from "@storybook/nextjs-vite";
import "../src/app/globals.css";

const preview: Preview = {
  parameters: {
    a11y: {
      test: "error",
    },
    layout: "centered",
    // Las pantallas navegan con el router de la app; sin este contexto
    // `useRouter` rompe el story aunque el build pase.
    nextjs: {
      appDirectory: true,
    },
  },
};

export default preview;
