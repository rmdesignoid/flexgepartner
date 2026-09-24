import { Search, UserPlus } from "lucide-react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Card, EmptyState } from ".";

const meta = { title: "Components/Core/Card", component: Card, tags: ["autodocs"], parameters: { layout: "centered" } } satisfies Meta<typeof Card>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { render: () => <Card><h3 style={{ margin: "0 0 8px" }}>Resources</h3><p style={{ margin: "0 0 16px", color: "var(--ds-muted)" }}>Reusable surfaces inherit the same tokens.</p><Button variant="secondary"><UserPlus size={15} />Add resource</Button></Card> };
export const Empty: Story = { render: () => <Card><EmptyState title="No resources found" description="Try changing the filters or create a new resource." action={<Button><Search size={15} />Search again</Button>} /></Card> };
