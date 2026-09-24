import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge, StatusBadge } from ".";

const meta = { title: "Components/Core/Badge", component: Badge, tags: ["autodocs"], parameters: { layout: "centered" } } satisfies Meta<typeof Badge>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { render: () => <Badge>Default label</Badge> };
export const PlanningStatuses: Story = { render: () => <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><StatusBadge status="To Plan" /><StatusBadge status="Planning" /><StatusBadge status="Planned" /><StatusBadge status="Taught" /></div> };
