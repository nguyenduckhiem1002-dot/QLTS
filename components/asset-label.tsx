// The printed yellow asset tag. Used on the detail page, the print sheet and the form preview.
export function AssetLabel({
  owner,
  code,
  name,
  barcodeSrc,
  barcodeAlt,
  meta,
  footer,
}: {
  owner: string;
  code: string;
  name: string;
  barcodeSrc: string | null;
  barcodeAlt: string;
  meta?: string;
  footer?: React.ReactNode;
}) {
  return (
    <article className="asset-label" aria-label={barcodeAlt}>
      <div className="asset-label-head">
        <span>{owner}</span>
        {meta ? <span className="asset-label-meta">{meta}</span> : <img src="/casla-mark.svg" alt="" aria-hidden="true" />}
      </div>
      <div className="asset-label-code">
        {barcodeSrc ? (
          <img src={barcodeSrc} alt={barcodeAlt} />
        ) : (
          <span className="barcode-fallback">{code}</span>
        )}
      </div>
      <strong>{code}</strong>
      <span className="asset-label-name">{name}</span>
      {footer ? <div className="asset-label-foot">{footer}</div> : null}
    </article>
  );
}
