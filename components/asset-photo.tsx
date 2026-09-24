"use client";

import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 4 * 1024 * 1024;

type Labels = {
  alt: string;
  empty: string;
  change: string;
  add: string;
  remove: string;
  removeConfirm: string;
  uploading: string;
  help: string;
  typeError: string;
  sizeError: string;
};

function Frame({
  imageUrl,
  labels,
  inputId,
  editable,
  fill,
}: {
  imageUrl: string | null;
  labels: Labels;
  inputId: string;
  editable: boolean;
  fill: boolean;
}) {
  const { pending } = useFormStatus();
  const content = (
    <>
      {imageUrl ? (
        <img src={imageUrl} alt={labels.alt} className={fill ? "is-fill" : undefined} />
      ) : (
        <span className="ad-photo-empty">
          <ImagePlus size={26} strokeWidth={1.6} aria-hidden="true" />
          {editable ? labels.add : labels.empty}
        </span>
      )}
      {editable && imageUrl ? (
        <span className="ad-photo-overlay" aria-hidden="true">
          <ImagePlus size={18} />
          {labels.change}
        </span>
      ) : null}
      {pending ? (
        <span className="ad-photo-overlay is-pending" role="status">
          <LoaderCircle className="spin" size={18} aria-hidden="true" />
          {labels.uploading}
        </span>
      ) : null}
    </>
  );

  return editable ? (
    <label htmlFor={inputId} className="ad-photo-frame is-editable" aria-label={imageUrl ? labels.change : labels.add}>
      {content}
    </label>
  ) : (
    <div className="ad-photo-frame">{content}</div>
  );
}

function RemoveButton({
  labels,
  removeAction,
}: {
  labels: Labels;
  removeAction: (formData: FormData) => void;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      formAction={removeAction}
      formNoValidate
      className="ad-link-button is-danger"
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(labels.removeConfirm)) event.preventDefault();
      }}
    >
      <Trash2 size={13} aria-hidden="true" />
      {labels.remove}
    </button>
  );
}

// The photo itself is the upload target: choosing a file submits immediately.
export function AssetPhoto({
  assetId,
  imageUrl,
  fill = false,
  editable,
  labels,
  uploadAction,
  removeAction,
}: {
  assetId: string;
  imageUrl: string | null;
  /** Edge-to-edge (generated illustrations) instead of an inset product photo. */
  fill?: boolean;
  editable: boolean;
  labels: Labels;
  uploadAction: (formData: FormData) => void;
  removeAction: (formData: FormData) => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputId = `asset-photo-${assetId}`;
  const [error, setError] = useState<string | null>(null);

  if (!editable) {
    return (
      <div className="ad-photo">
        <Frame imageUrl={imageUrl} labels={labels} inputId={inputId} editable={false} fill={fill} />
      </div>
    );
  }

  return (
    <form ref={formRef} action={uploadAction} className="ad-photo">
      <input type="hidden" name="assetId" value={assetId} />
      <input
        id={inputId}
        className="image-picker-input"
        type="file"
        name="image"
        accept={ACCEPTED.join(",")}
        onChange={(event) => {
          const file = event.target.files?.[0];
          setError(null);
          if (!file) return;
          if (!ACCEPTED.includes(file.type)) {
            setError(labels.typeError);
            event.target.value = "";
            return;
          }
          if (file.size > MAX_BYTES) {
            setError(labels.sizeError);
            event.target.value = "";
            return;
          }
          formRef.current?.requestSubmit();
        }}
      />
      <Frame imageUrl={imageUrl} labels={labels} inputId={inputId} editable fill={fill} />
      <div className="ad-photo-foot">
        {error ? (
          <small className="field-error" role="alert">
            {error}
          </small>
        ) : (
          <small className="ad-hint">{labels.help}</small>
        )}
        {imageUrl ? <RemoveButton labels={labels} removeAction={removeAction} /> : null}
      </div>
    </form>
  );
}
