import { useState } from "react";
import { BookOpen, ClipboardList, FileText } from "lucide-react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tabs } from ".";

const items = [{ value: "overview", label: "Overview" }, { value: "details", label: "Details" }, { value: "activity", label: "Activity" }];
const meta = { title: "Components/Core/Tabs", component: Tabs, tags: ["autodocs"], parameters: { layout: "centered" } } satisfies Meta<typeof Tabs>;
export default meta;
type Story = StoryObj<typeof meta>;
function InteractiveTabs({ initial = "overview" }: { initial?: string }) { const [value, setValue] = useState(initial); return <Tabs value={value} onChange={setValue} items={items} />; }
export const Default: Story = { render: () => <InteractiveTabs /> };
export const SecondaryActive: Story = { render: () => <InteractiveTabs initial="details" /> };
export const Disabled: Story = { render: () => <Tabs value="overview" onChange={() => undefined} items={[...items.slice(0, 2), { value: "activity", label: "Activity", disabled: true }]} /> };
export const WithIcons: Story = { render: () => <InteractiveTabsWithIcons /> };
function InteractiveTabsWithIcons() { const [value, setValue] = useState("overview"); return <Tabs value={value} onChange={setValue} items={[{ value: "overview", label: "Overview", icon: <ClipboardList size={16} aria-hidden="true" /> }, { value: "details", label: "Details", icon: <FileText size={16} aria-hidden="true" /> }, { value: "activity", label: "Activity", icon: <BookOpen size={16} aria-hidden="true" /> }]} />; }
