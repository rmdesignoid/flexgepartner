import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import "./styles.css";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const cx = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(" ");

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean }>(function Button({ variant = "primary", size = "md", loading = false, disabled, children, className, ...props }, ref) {
  return <button ref={ref} className={cx("ds-button", `ds-button--${variant}`, `ds-button--${size}`, className)} disabled={disabled || loading} {...props}>{loading ? "Loading…" : children}</button>;
});

export const IconButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { size?: Size; label: string }>(function IconButton({ size = "md", label, className, children, ...props }, ref) {
  return <button ref={ref} className={cx("ds-icon-button", `ds-icon-button--${size}`, className)} aria-label={label} {...props}>{children}</button>;
});

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(function Input({ invalid, className, ...props }, ref) {
  return <input ref={ref} className={cx("ds-input", invalid && "ds-input--invalid", className)} aria-invalid={invalid || undefined} {...props} />;
});

export function SearchInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <Input type="search" className={cx("ds-search-input", className)} {...props} />;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(function Textarea({ invalid, className, ...props }, ref) {
  return <textarea ref={ref} className={cx("ds-input", "ds-textarea", invalid && "ds-input--invalid", className)} aria-invalid={invalid || undefined} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }>(function Select({ invalid, className, children, ...props }, ref) {
  return <select ref={ref} className={cx("ds-input", "ds-select", invalid && "ds-input--invalid", className)} aria-invalid={invalid || undefined} {...props}>{children}</select>;
});

export function FormField({ label, hint, error, required, children }: { label: string; hint?: string; error?: string; required?: boolean; children: ReactNode }) {
  return <label className="ds-field"><span className="ds-field__label">{label}{required ? <span aria-hidden="true"> *</span> : null}</span>{children}{error ? <span className="ds-field__error">{error}</span> : hint ? <span className="ds-field__hint">{hint}</span> : null}</label>;
}

export function Badge({ children }: { children: ReactNode }) {
  return <span className="ds-badge">{children}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const slug = status.toLowerCase().replace(/\s+/g, "-");
  const planningStatus = ["to-plan", "planning", "planned", "taught"].includes(slug);
  return planningStatus
    ? <span className={`ds-badge ds-status-badge ds-status-badge--${slug}`}>{status}</span>
    : <Badge>{status}</Badge>;
}

export function Avatar({ name, src, size = "md" }: { name: string; src?: string; size?: Size }) {
  const initials = name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return <span className={`ds-avatar ds-avatar--${size}`} aria-label={name}>{src ? <img src={src} alt="" /> : initials}</span>;
}

export function AvatarStack({ items, max = 4, size = "md" }: { items: Array<{ name: string; src?: string }>; max?: number; size?: Size }) {
  const visibleItems = items.slice(0, max);
  const hiddenCount = Math.max(items.length - visibleItems.length, 0);
  return <div className="ds-avatar-stack" aria-label={`${items.length} people`}>
    {visibleItems.map((item) => <Avatar key={item.name} name={item.name} src={item.src} size={size} />)}
    {hiddenCount ? <span className={`ds-avatar ds-avatar--${size} ds-avatar-stack__overflow`} aria-label={`${hiddenCount} more people`}>+{hiddenCount}</span> : null}
  </div>;
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cx("ds-card", className)}>{children}</section>;
}

export function Tabs({ items, value, onChange }: { items: Array<{ value: string; label: string; icon?: ReactNode; disabled?: boolean }>; value: string; onChange: (value: string) => void }) {
  return <div className="ds-tabs" role="tablist">{items.map((item) => <button key={item.value} type="button" role="tab" aria-selected={item.value === value} disabled={item.disabled} className={cx("ds-tab", item.value === value && "is-active")} onClick={() => onChange(item.value)}>{item.icon}{item.label}</button>)}</div>;
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="ds-empty-state"><h3>{title}</h3>{description ? <p>{description}</p> : null}{action}</div>;
}

export const designSystemStyles = `
.ds-button,.ds-icon-button,.ds-input,.ds-tabs button{transition:background .15s ease,border-color .15s ease,box-shadow .15s ease,color .15s ease}
.ds-button{min-height:var(--ds-control-height);display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:0 12px;border:1px solid transparent;border-radius:var(--ds-radius-sm);cursor:pointer;font-weight: var(--ds-font-weight-semibold);white-space:nowrap}.ds-button:focus-visible,.ds-icon-button:focus-visible,.ds-input:focus-visible,.ds-tabs button:focus-visible{outline:0;box-shadow:var(--ds-focus-ring)}.ds-button:disabled,.ds-icon-button:disabled{cursor:not-allowed;opacity:.6}.ds-button--primary{color:#fff;background:var(--ds-accent)}.ds-button--primary:hover:not(:disabled){background:var(--ds-accent-hover)}.ds-button--secondary{color:var(--ds-foreground);border-color:var(--ds-border);background:var(--ds-surface)}.ds-button--secondary:hover:not(:disabled){background:var(--ds-surface-soft)}.ds-button--ghost{color:var(--ds-primary);background:transparent}.ds-button--danger{color:#fff;background:var(--ds-danger)}.ds-button--sm{min-height:28px;padding-inline:10px;font-size: var(--ds-font-size-xs); line-height: var(--ds-line-height-xs)}.ds-button--lg{min-height:40px;padding-inline:16px}.ds-icon-button{width:var(--ds-control-height);height:var(--ds-control-height);display:inline-grid;place-items:center;padding:0;border:1px solid var(--ds-border);border-radius:var(--ds-radius-sm);color:var(--ds-foreground);background:var(--ds-surface);cursor:pointer}.ds-icon-button:hover:not(:disabled){background:var(--ds-surface-soft)}.ds-icon-button--sm{width:28px;height:28px}.ds-icon-button--lg{width:40px;height:40px}.ds-input{width:100%;min-height:var(--ds-control-height);padding:5px 9px;border:1px solid var(--ds-border);border-radius:var(--ds-radius-sm);color:var(--ds-foreground);background:var(--ds-surface)}.ds-input::placeholder{color:var(--ds-muted)}.ds-input--invalid{border-color:var(--ds-danger)}.ds-textarea{min-height:88px;resize:vertical}.ds-select{cursor:pointer}.ds-field{display:grid;gap:6px}.ds-field__label{font-size: var(--ds-font-size-sm); line-height: var(--ds-line-height-sm);font-weight: var(--ds-font-weight-semibold)}.ds-field__hint,.ds-field__error{font-size: var(--ds-font-size-xs);line-height: var(--ds-line-height-xs)}.ds-field__hint{color:var(--ds-muted)}.ds-field__error{color:var(--ds-danger)}.ds-badge{display:inline-flex;align-items:center;min-height:24px;padding:2px 8px;border-radius: var(--ds-radius-full);font-size: var(--ds-font-size-xs); line-height: var(--ds-line-height-xs);font-weight: var(--ds-font-weight-medium)}.ds-badge--neutral{color:var(--ds-muted);background:var(--ds-secondary)}.ds-badge--info{color:var(--ds-primary);background:var(--ds-primary-soft)}.ds-badge--success{color:var(--ds-success);background:color-mix(in srgb,var(--ds-success) 14%,transparent)}.ds-badge--warning{color:var(--ds-warning);background:color-mix(in srgb,var(--ds-warning) 14%,transparent)}.ds-badge--danger{color:var(--ds-danger);background:color-mix(in srgb,var(--ds-danger) 14%,transparent)}.ds-avatar{display:inline-grid;place-items:center;overflow:hidden;border-radius:50%;color:#fff;background:var(--ds-primary);font-size: var(--ds-font-size-xs); line-height: var(--ds-line-height-xs);font-weight: var(--ds-font-weight-bold)}.ds-avatar img{width:100%;height:100%;object-fit:cover}.ds-avatar--sm{width:24px;height:24px;font-size: var(--ds-font-size-xs); line-height: var(--ds-line-height-xs)}.ds-avatar--md{width:32px;height:32px}.ds-avatar--lg{width:40px;height:40px;font-size: var(--ds-font-size-sm); line-height: var(--ds-line-height-sm)}.ds-card{padding:16px;border:1px solid var(--ds-border);border-radius:var(--ds-radius-lg);background:var(--ds-surface);box-shadow:0 1px 3px #0f172a0a}.ds-tabs{display:flex;gap:2px;border-bottom:1px solid var(--ds-border)}.ds-tab{min-height:40px;padding:0 12px;border:0;border-bottom:2px solid transparent;color:var(--ds-muted);background:transparent;cursor:pointer;font-weight: var(--ds-font-weight-semibold)}.ds-tab.is-active{color:var(--ds-primary);border-bottom-color:var(--ds-primary)}.ds-empty-state{display:grid;place-items:center;gap:8px;padding:40px 24px;text-align:center}.ds-empty-state h3,.ds-empty-state p{margin:0}.ds-empty-state p{max-width:42ch;color:var(--ds-muted)}
` + `
.ds-input:hover:not(:disabled):not([aria-invalid="true"]),.ds-input[data-state="hover"]{border-color:color-mix(in srgb,var(--ds-foreground) 28%,var(--ds-border));background:var(--ds-surface-soft)}
.ds-input:focus-visible,.ds-input[data-state="focus"]{outline:0;border-color:var(--ds-primary);background:var(--ds-surface);box-shadow:var(--ds-focus-ring)}
.ds-input:not(:placeholder-shown),.ds-input[data-state="filled"]{color:var(--ds-foreground)}
.ds-input:disabled,.ds-input[data-state="disabled"]{cursor:not-allowed;opacity:.5;background:var(--ds-surface-soft)}
.ds-input[aria-invalid="true"],.ds-input--invalid,.ds-input[data-state="invalid"]{border-color:var(--ds-danger)}
.ds-input[aria-invalid="true"]:focus-visible,.ds-input--invalid:focus-visible,.ds-input[data-state="invalid"]{box-shadow:var(--ds-error-ring)}
`;
