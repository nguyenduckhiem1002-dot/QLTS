"use client";

import { useEffect, useState } from "react";
import { AssetLabel } from "@/components/asset-label";

type Snapshot = { code: string; name: string; barcode: string; locationId: string };

function read(form: HTMLFormElement): Snapshot {
  const data = new FormData(form);
  const text = (key: string) => String(data.get(key) ?? "").trim();
  return { code: text("code"), name: text("name"), barcode: text("barcode"), locationId: text("locationId") };
}

// Mirrors the asset form into a live label, so people see what will be printed.
export function LabelPreview({
  formId,
  owner,
  placeholderCode,
  placeholderName,
  barcodeAlt,
  locations,
}: {
  formId: string;
  owner: string;
  placeholderCode: string;
  placeholderName: string;
  barcodeAlt: string;
  locations: { id: string; name: string }[];
}) {
  const [snapshot, setSnapshot] = useState<Snapshot>({ code: "", name: "", barcode: "", locationId: "" });
  const [barcodeText, setBarcodeText] = useState("");

  useEffect(() => {
    const form = document.getElementById(formId);
    if (!(form instanceof HTMLFormElement)) return;
    const update = () => setSnapshot(read(form));
    update();
    form.addEventListener("input", update);
    form.addEventListener("change", update);
    return () => {
      form.removeEventListener("input", update);
      form.removeEventListener("change", update);
    };
  }, [formId]);

  // Only ask the server for a new barcode once typing pauses.
  const wanted = snapshot.barcode || snapshot.code;
  useEffect(() => {
    const timer = setTimeout(() => setBarcodeText(wanted), 350);
    return () => clearTimeout(timer);
  }, [wanted]);

  const location = locations.find((item) => item.id === snapshot.locationId);

  return (
    <AssetLabel
      owner={owner}
      code={snapshot.code || placeholderCode}
      name={snapshot.name || placeholderName}
      meta={location?.name}
      barcodeSrc={barcodeText ? `/api/barcode?text=${encodeURIComponent(barcodeText)}` : null}
      barcodeAlt={barcodeAlt}
    />
  );
}
