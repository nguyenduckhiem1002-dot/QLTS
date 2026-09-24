import type { TranslationKey } from "@/lib/i18n";

// i18n keys used by the client-side employees screen (without the "emp." prefix).
export const EMPLOYEE_LABEL_KEYS = [
  "summary", "search", "searchLabel", "deptFilter", "all", "noDept", "sortLabel",
  "sortGiven", "sortCode", "sortHolds", "colEmployee", "colCode", "colDept", "colHolds",
  "noEmail", "none", "holdsNothing", "noMatch", "noMatchFilter", "emptyTitle", "emptyHelp",
  "panelEmptyTitle", "panelEmptyHelp", "codeShort", "email", "holdingCount", "since",
  "takeBack", "takeBackConfirm", "holdsNothingHelp", "editInfo", "add", "editTitle",
  "addHelp", "editHelp", "fieldCode", "fieldName", "fieldDept", "fieldEmail", "optional",
  "deptPlaceholder", "codePlaceholder", "namePlaceholder", "emailPlaceholder",
  "duplicateNotice", "duplicateLink", "cancel", "save", "saving", "delete", "deleteConfirm",
  "toastAdded", "toastSaved", "toastReturned", "toastDeleted", "errRequired", "errDuplicate",
  "errInUse", "errReadonly", "errNotFound", "errGeneric",
] as const;

export type EmployeeLabelKey = (typeof EMPLOYEE_LABEL_KEYS)[number];
export type EmployeeLabels = Record<EmployeeLabelKey, string>;

export function buildEmployeeLabels(t: (key: TranslationKey) => string): EmployeeLabels {
  return Object.fromEntries(
    EMPLOYEE_LABEL_KEYS.map((key) => [key, t(`emp.${key}` as TranslationKey)]),
  ) as EmployeeLabels;
}
