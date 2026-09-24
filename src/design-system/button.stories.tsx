import { Settings, UserPlus } from "lucide-react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, IconButton } from ".";

const meta = {
  title: "Components/Core/Button",
  component: Button,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  argTypes: {
    variant: { control: "select", options: ["primary", "secondary", "ghost", "danger"] },
    size: { control: "select", options: ["sm", "md", "lg"] },
    loading: { control: "boolean" },
    disabled: { control: "boolean" },
    children: { control: "text" },
  },
  args: { variant: "primary", size: "md", children: "Primary action", loading: false, disabled: false },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Secondary: Story = { args: { variant: "secondary", children: "Secondary" } };
export const Ghost: Story = { args: { variant: "ghost", children: "Ghost" } };
export const Danger: Story = { args: { variant: "danger", children: "Delete" } };
export const Loading: Story = { args: { variant: "secondary", loading: true, children: "Loading…" } };
export const Disabled: Story = { args: { disabled: true } };
export const WithIcon: Story = { render: (args) => <Button {...args}><UserPlus size={15} />Add resource</Button>, args: { variant: "secondary" } };
export const IconOnly: Story = { render: () => <IconButton label="Settings"><Settings size={16} /></IconButton> };
