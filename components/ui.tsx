import { CircleAlert, CircleCheck, Lock, type LucideIcon } from "lucide-react";

export function FieldLabel({
  children,
  required,
  requiredLabel,
  optionalLabel,
}: {
  children: React.ReactNode;
  required?: boolean;
  requiredLabel?: string;
  optionalLabel?: string;
}) {
  return (
    <span className="field-label">
      {children}
      {required ? (
        <abbr className="field-required" title={requiredLabel}>
          *
        </abbr>
      ) : optionalLabel ? (
        <em className="field-optional">{optionalLabel}</em>
      ) : null}
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="empty-block">
      <span className="empty-block-icon">
        <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
      </span>
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
    </div>
  );
}

export function Notice({
  tone,
  children,
}: {
  tone: "success" | "error";
  children: React.ReactNode;
}) {
  const Icon = tone === "success" ? CircleCheck : CircleAlert;
  return (
    <div className={`notice notice-${tone}`} role={tone === "error" ? "alert" : "status"}>
      <Icon size={17} strokeWidth={2} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

export function ReadonlyPanel({ title, message }: { title: string; message: string }) {
  return (
    <aside className="panel side-panel readonly-panel">
      <span className="readonly-panel-icon">
        <Lock size={18} strokeWidth={1.8} aria-hidden="true" />
      </span>
      <h2>{title}</h2>
      <p>{message}</p>
    </aside>
  );
}
