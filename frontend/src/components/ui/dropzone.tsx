"use client";

import * as React from "react";
import { IconCloudUpload, IconFileDescription, IconX } from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { useT } from "@/hooks/use-t";

interface DropzoneProps {
  /** id of the hidden file input; keeps FieldLabel htmlFor wiring intact. */
  id: string;
  /** `accept` attribute forwarded to the file input. */
  accept: string;
  /** Currently selected file, or null for the empty state. */
  file: File | null;
  /** Called with the picked file (or undefined when the picker is cleared). */
  onSelect: (file: File | undefined) => void;
  /** Clears the current selection. */
  onClear: () => void;
  /** Renders the error affordance (destructive border + aria-invalid). */
  invalid?: boolean;
  /** id(s) for aria-describedby on the input (error or hint element). */
  describedBy?: string;
}

function formatSize(bytes: number): string {
  const kb = bytes / 1024;
  if (kb < 1) return "1 KB";
  return `${Math.round(kb).toLocaleString()} KB`;
}

export function Dropzone({
  id,
  accept,
  file,
  onSelect,
  onClear,
  invalid = false,
  describedBy,
}: DropzoneProps) {
  const t = useT();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);

  function handleClear() {
    if (inputRef.current) inputRef.current.value = "";
    onClear();
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragging(false);
    onSelect(event.dataTransfer.files?.[0]);
  }

  return (
    <div className="w-full">
      {/* Always mounted so FieldLabel htmlFor + a11y association stay wired. */}
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className="peer sr-only"
        onChange={(event) => onSelect(event.target.files?.[0])}
      />

      {file ? (
        <div
          className={cn(
            "flex items-center gap-3 rounded-control border bg-surface px-3 py-3",
            "peer-focus-visible:border-ring peer-focus-visible:ring-2 peer-focus-visible:ring-ring/50",
            invalid ? "border-destructive" : "border-input",
          )}
        >
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-control bg-tint-brand-5 text-brand"
          >
            <IconFileDescription className="size-5" stroke={1.75} />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-ink">{file.name}</span>
            <span className="font-mono text-xs tabular-nums text-ink-muted">
              {formatSize(file.size)}
            </span>
          </span>
          <button
            type="button"
            onClick={handleClear}
            aria-label={t("cxr.dropzone.remove")}
            className="ml-auto flex size-11 shrink-0 items-center justify-center rounded-control text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <IconX className="size-5" stroke={1.75} />
          </button>
        </div>
      ) : (
        <label
          htmlFor={id}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-control border border-dashed px-6 py-8 text-center transition-colors",
            "peer-focus-visible:border-ring peer-focus-visible:ring-2 peer-focus-visible:ring-ring/50",
            invalid
              ? "border-destructive"
              : dragging
                ? "border-brand bg-tint-brand-5"
                : "border-input hover:border-brand hover:bg-tint-brand-5",
          )}
        >
          <IconCloudUpload
            aria-hidden="true"
            className={cn("size-8", dragging ? "text-brand" : "text-ink-muted")}
            stroke={1.5}
          />
          <span className="text-sm font-medium text-ink">
            {dragging ? t("cxr.dropzone.dropping") : t("cxr.dropzone.cta")}
          </span>
          <span className="text-sm text-ink-muted">{t("cxr.imageHint")}</span>
        </label>
      )}
    </div>
  );
}
