"use client";

import { ImagePlus, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 4 * 1024 * 1024;

type Labels = {
  label: string;
  cta: string;
  help: string;
  remove: string;
  typeError: string;
  sizeError: string;
};

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImagePicker({
  name,
  labels,
  disabled,
}: {
  name: string;
  labels: Labels;
  disabled?: boolean;
}) {
  const inputId = useId();
  const helpId = `${inputId}-help`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function clear() {
    if (inputRef.current) inputRef.current.value = "";
    setFile(null);
  }

  function accept(next: File | undefined) {
    setError(null);
    if (!next) {
      setFile(null);
      return;
    }
    if (!ACCEPTED.includes(next.type)) {
      setError(labels.typeError);
      clear();
      return;
    }
    if (next.size > MAX_BYTES) {
      setError(labels.sizeError);
      clear();
      return;
    }
    setFile(next);
  }

  return (
    <div className="image-picker">
      <span className="field-label" id={`${inputId}-label`}>
        {labels.label}
      </span>

      <div
        className={`image-picker-zone${dragging ? " is-dragging" : ""}${file ? " has-file" : ""}`}
        onDragOver={(event) => {
          if (disabled) return;
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          if (disabled) return;
          event.preventDefault();
          setDragging(false);
          const dropped = event.dataTransfer.files?.[0];
          if (dropped && inputRef.current) {
            const transfer = new DataTransfer();
            transfer.items.add(dropped);
            inputRef.current.files = transfer.files;
          }
          accept(dropped);
        }}
      >
        <input
          ref={inputRef}
          id={inputId}
          className="image-picker-input"
          name={name}
          type="file"
          accept={ACCEPTED.join(",")}
          disabled={disabled}
          aria-labelledby={`${inputId}-label`}
          aria-describedby={helpId}
          onChange={(event) => accept(event.target.files?.[0])}
        />

        {file && preview ? (
          <div className="image-picker-selected">
            <img src={preview} alt="" className="image-picker-thumb" />
            <div className="image-picker-meta">
              <strong>{file.name}</strong>
              <span>{formatSize(file.size)}</span>
            </div>
            <button
              type="button"
              className="image-picker-remove"
              onClick={clear}
              aria-label={labels.remove}
              title={labels.remove}
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <label htmlFor={inputId} className="image-picker-empty">
            <span className="image-picker-icon">
              <ImagePlus size={20} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <span className="image-picker-cta">{labels.cta}</span>
          </label>
        )}
      </div>

      {error ? (
        <small className="field-error" role="alert">
          {error}
        </small>
      ) : (
        <small className="form-hint" id={helpId}>
          {labels.help}
        </small>
      )}
    </div>
  );
}
