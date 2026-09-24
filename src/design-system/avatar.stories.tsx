import type { Meta, StoryObj } from "@storybook/react-vite";
import { Avatar, AvatarStack } from ".";

const people = [
  { name: "Ana Martins", src: "/avatar-photo.png" },
  { name: "Gabriel Santos", src: "/avatar-photo-gabriel.png" },
  { name: "Mariana Costa", src: "/avatar-photo-mariana.png" },
  { name: "Rafael Paz" },
  { name: "Camila Rocha" },
]; 

const meta = { title: "Components/Core/Avatar", component: Avatar, tags: ["autodocs"], parameters: { layout: "centered" }, argTypes: { size: { control: "select", options: ["sm", "md", "lg"] } } } satisfies Meta<typeof Avatar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Initials: Story = { args: { name: "Ana Martins", size: "md" } };
export const Photos: Story = { render: () => <div style={{ display: "flex", alignItems: "center", gap: 16 }}><Avatar {...people[0]} size="sm" /><Avatar {...people[1]} size="md" /><Avatar {...people[2]} size="lg" /></div> };
export const Stacks: Story = { render: () => <div style={{ display: "grid", gap: 24 }}><div><p style={{ margin: "0 0 8px", color: "var(--ds-muted)" }}>Three people</p><AvatarStack items={people.slice(0, 3)} /></div><div><p style={{ margin: "0 0 8px", color: "var(--ds-muted)" }}>Overflow count</p><AvatarStack items={people} max={3} /></div><div><p style={{ margin: "0 0 8px", color: "var(--ds-muted)" }}>Large stack</p><AvatarStack items={people} max={4} size="lg" /></div></div> };
