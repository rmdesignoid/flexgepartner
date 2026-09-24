import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { FormField, Input, SearchInput, Select, Textarea } from ".";

const meta = { title: "Components/Core/Fields", tags: ["autodocs"], parameters: { layout: "centered" } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
const frame = (children: ReactNode) => <div style={{ width: 320, display: "grid", gap: 16 }}>{children}</div>;

export const Default: Story = { render: () => frame(<FormField label="Name" required hint="Use the student's full name."><Input placeholder="Enter a name" /></FormField>) };
export const Search: Story = { render: () => frame(<FormField label="Search"><SearchInput placeholder="Search resources" /></FormField>) };
export const SelectField: Story = { render: () => frame(<FormField label="Level"><Select defaultValue="A1"><option value="A1">A1</option><option value="A2">A2</option><option value="B1">B1</option></Select></FormField>) };
export const Invalid: Story = { render: () => frame(<FormField label="Instructions" error="This field is required."><Textarea invalid placeholder="Describe how this resource should be used" /></FormField>) };
export const Disabled: Story = { render: () => frame(<FormField label="Name"><Input disabled value="Locked value" readOnly /></FormField>) };
export const States: Story = { render: () => frame(<>
  <FormField label="Default"><Input placeholder="Enter a value" /></FormField>
  <FormField label="Hover"><Input data-state="hover" placeholder="Enter a value" /></FormField>
  <FormField label="Focus"><Input data-state="focus" placeholder="Enter a value" /></FormField>
  <FormField label="Filled"><Input data-state="filled" defaultValue="Filled value" /></FormField>
  <FormField label="Disabled"><Input disabled defaultValue="Disabled value" /></FormField>
  <FormField label="Invalid" error="This field is required."><Input invalid data-state="invalid" defaultValue="Invalid value" /></FormField>
</>) };
