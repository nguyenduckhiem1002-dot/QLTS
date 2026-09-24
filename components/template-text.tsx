import { Fragment } from "react";

// Renders "{actor} handed {asset} to {employee}" with React nodes in the slots.
export function TemplateText({
  template,
  slots,
}: {
  template: string;
  slots: Record<string, React.ReactNode>;
}) {
  return (
    <>
      {template.split(/(\{\w+\})/).map((part, index) => {
        const key = part.match(/^\{(\w+)\}$/)?.[1];
        return <Fragment key={index}>{key ? slots[key] ?? "" : part}</Fragment>;
      })}
    </>
  );
}
