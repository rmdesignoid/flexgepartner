import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx|mdx)", "../src/**/*.mdx"],
  staticDirs: ["../public"],
  addons: ["@storybook/addon-a11y", "@storybook/addon-docs"],
  framework: { name: "@storybook/react-vite", options: { builder: { viteConfigPath: ".storybook/vite.config.ts" } } },
  docs: { autodocs: "tag" },
  viteFinal: async (config) => ({
    ...config,
    // The app's Vite config enables vinext/RSC/Cloudflare plugins. Storybook
    // renders client components and must not run the app's RSC asset manifest.
    plugins: config.plugins?.filter((plugin) => {
      const name = typeof plugin === "object" && plugin && "name" in plugin ? String(plugin.name) : "";
      return !name.includes("rsc") && !name.includes("vinext") && !name.includes("cloudflare") && !name.includes("sites");
    }),
  }),
};

export default config;
