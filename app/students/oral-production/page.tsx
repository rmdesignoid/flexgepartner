import type { Metadata } from "next";
import { StudentOralProductionHistory } from "../../../src/features/ai-conversation/StudentOralProductionHistory";

export const metadata: Metadata = {
  title: "Oral Production history | Flexge",
  description: "Student profile and Oral Production report history.",
};

export default function StudentOralProductionPage() {
  return <StudentOralProductionHistory />;
}
