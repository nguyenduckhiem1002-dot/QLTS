"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

// Primary submit button that shows progress while its form's server action runs.
export function SubmitButton({
  children,
  pendingLabel,
  className = "btn btn-primary",
  disabled,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className={className}
      type="submit"
      disabled={disabled || pending}
      aria-disabled={disabled || pending}
      data-pending={pending ? "true" : undefined}
    >
      {pending ? (
        <>
          <LoaderCircle className="spin" size={15} aria-hidden="true" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
