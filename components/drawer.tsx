"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

// A button that opens a right-side <dialog>. The body is usually a server-action
// form rendered on the server and passed in as children.
export function Drawer({
  trigger,
  triggerClassName = "btn btn-primary",
  title,
  description,
  closeLabel,
  defaultOpen = false,
  children,
}: {
  trigger: React.ReactNode;
  triggerClassName?: string;
  title: string;
  description?: string;
  closeLabel: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <button type="button" className={triggerClassName} onClick={() => setOpen(true)}>
        {trigger}
      </button>
      <dialog
        ref={ref}
        className="drawer"
        aria-labelledby={titleId}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          // A click on the backdrop lands on the dialog element itself.
          if (event.target === event.currentTarget) setOpen(false);
        }}
      >
        {open ? (
          <>
            <div className="drawer-head">
              <div>
                <h2 id={titleId}>{title}</h2>
                {description ? <p>{description}</p> : null}
              </div>
              <button
                type="button"
                className="icon-button drawer-close"
                aria-label={closeLabel}
                onClick={() => setOpen(false)}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            {children}
          </>
        ) : null}
      </dialog>
    </>
  );
}

// Closes the surrounding drawer; used for "Cancel" in drawer footers.
export function DrawerCancel({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="btn"
      onClick={(event) => event.currentTarget.closest("dialog")?.close()}
    >
      {children}
    </button>
  );
}
