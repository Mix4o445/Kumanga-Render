"use client";

import { Trash2 } from "lucide-react";

/**
 * Submits a delete server action after a confirmation prompt. Hidden fields
 * are passed via `fields`. Keeps destructive actions behind an explicit click.
 */
export function DeleteButton({
  action,
  fields,
  confirmMessage,
  label,
  className,
  iconOnly = false,
}: {
  action: (formData: FormData) => void | Promise<void>;
  fields: Record<string, string>;
  confirmMessage: string;
  label: string;
  className?: string;
  iconOnly?: boolean;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <button
        type="submit"
        aria-label={label}
        title={label}
        className={
          className ??
          "inline-flex items-center gap-1.5 rounded-pill bg-rose-500/15 px-3 py-2 text-xs font-bold text-rose-300 ring-1 ring-rose-500/30 transition-colors hover:bg-rose-500/25 active:scale-95"
        }
      >
        <Trash2 className="size-4" aria-hidden />
        {iconOnly ? null : label}
      </button>
    </form>
  );
}
