"use client";

import { Trash2 } from "lucide-react";

export function ConfirmSubmit({
  label,
  message,
  disabled,
}: {
  label: string;
  message: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      className="button button-danger-soft"
      disabled={disabled}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      <Trash2 size={15} aria-hidden="true" />
      {label}
    </button>
  );
}
