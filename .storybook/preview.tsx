import type { Preview } from "@storybook/react-vite";
import { useEffect, type ReactNode } from "react";
import "../src/design-system/styles.css";

function ThemeCanvas({ theme, children }: { theme: "light" | "dark"; children: ReactNode }) {
  useEffect(() => {
    const body = document.body;
    const background = theme === "dark" ? "#17191f" : "#f5f5f7";
    const color = theme === "dark" ? "#f5f7fa" : "#1d1d1f";
    const previous = { background: body.style.background, color: body.style.color };
    body.style.background = background;
    body.style.color = color;
    return () => {
      body.style.background = previous.background;
      body.style.color = previous.color;
    };
  }, [theme]);

  return <div className="ds-root" data-theme={theme}>{children}</div>;
}

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Design system theme",
      defaultValue: "light",
      toolbar: { title: "Theme", icon: "paintbrush", items: ["light", "dark"] },
    },
  },
  decorators: [(Story, context) => <ThemeCanvas theme={context.globals.theme}><Story /></ThemeCanvas>],
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    a11y: { test: "todo" },
  },
  tags: ["autodocs"],
};

export default preview;
