import { CircleAlert, CircleCheck, Lock, TriangleAlert, type LucideIcon } from "lucide-react";

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
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
      </span>
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
      {children}
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

export function WarningNotice({
  title,
  children,
  action,
}: {
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="notice notice-warning" role="status">
      <TriangleAlert size={17} strokeWidth={2} aria-hidden="true" />
      <div className="notice-body">
        <strong>{title}</strong>
        {children ? <span>{children}</span> : null}
      </div>
      {action}
    </div>
  );
}

export function ReadonlyNotice({ title, message }: { title: string; message: string }) {
  return (
    <div className="notice notice-warning" role="status">
      <Lock size={17} strokeWidth={2} aria-hidden="true" />
      <div className="notice-body">
        <strong>{title}</strong>
        <span>{message}</span>
      </div>
    </div>
  );
}

export function StatusText({
  status,
  label,
  pill,
}: {
  status: string;
  label: string;
  pill?: boolean;
}) {
  return (
    <span className={pill ? "status status-pill" : "status"} data-status={status}>
      {label}
    </span>
  );
}
