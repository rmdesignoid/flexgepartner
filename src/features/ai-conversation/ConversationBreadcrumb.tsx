import { ChevronRight } from "lucide-react";

type BreadcrumbItem = { label: string; onNavigate: () => void };

export function ConversationBreadcrumb({ items, current }: { items: BreadcrumbItem[]; current: string }) {
  return <nav className="ai-breadcrumb" aria-label="Conversation navigation">
    <ol>
      {items.map((item, index) => <li key={index}>
        <button type="button" onClick={item.onNavigate} title={item.label}>{item.label}</button>
        <ChevronRight size={14} aria-hidden="true" />
      </li>)}
      <li className="ai-breadcrumb-current"><h1 aria-current="page" title={current}>{current}</h1></li>
    </ol>
  </nav>;
}
