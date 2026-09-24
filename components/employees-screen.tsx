"use client";

import { Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { EmployeeLabels } from "@/components/employees-labels";
import { returnAssetToStorage } from "@/lib/actions/assets";
import { removeEmployee, saveEmployee, type EmployeeActionResult } from "@/lib/actions/reference";
import { getInitials } from "@/lib/format";

type HeldAsset = { id: string; code: string; name: string; since: Date | null };

export type EmployeeRow = {
  id: string;
  employeeCode: string;
  name: string;
  email: string | null;
  department: string | null;
  historyCount: number;
  assets: HeldAsset[];
};

type SortKey = "given" | "code" | "holds";
type DialogState = { mode: "add" } | { mode: "edit"; id: string } | null;

const ALL = "__all__";
const NO_DEPT = "__none__";

const plain = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();

// Vietnamese names sort by given name (the last word), then by full name.
const givenName = (name: string) => name.trim().split(/\s+/).pop() ?? name;
const collator = new Intl.Collator("vi");

function fill(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""));
}

export function EmployeesScreen({
  employees: initial,
  labels: l,
  canManage,
  locale,
}: {
  employees: EmployeeRow[];
  labels: EmployeeLabels;
  canManage: boolean;
  locale: string;
}) {
  const router = useRouter();
  const [employees, setEmployees] = useState(initial);
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState(ALL);
  const [sort, setSort] = useState<SortKey>("given");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [, startRefresh] = useTransition();
  const panelRef = useRef<HTMLElement>(null);

  // Server data wins whenever a refresh brings new props.
  useEffect(() => setEmployees(initial), [initial]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  const dateFormat = useMemo(
    () => new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", { day: "2-digit", month: "2-digit", year: "numeric" }),
    [locale],
  );

  const deptCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const employee of employees) {
      const key = employee.department || NO_DEPT;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()].sort(([a], [b]) =>
      a === NO_DEPT ? 1 : b === NO_DEPT ? -1 : collator.compare(a, b),
    );
  }, [employees]);

  const rows = useMemo(() => {
    const q = plain(query.trim());
    const filtered = employees.filter((employee) => {
      if (dept !== ALL && (employee.department || NO_DEPT) !== dept) return false;
      if (!q) return true;
      return plain(
        [employee.name, employee.employeeCode, employee.email ?? "", ...employee.assets.map((a) => a.code)].join(" "),
      ).includes(q);
    });
    return filtered.sort((a, b) => {
      if (sort === "code") return a.employeeCode.localeCompare(b.employeeCode);
      if (sort === "holds" && b.assets.length !== a.assets.length) return b.assets.length - a.assets.length;
      return collator.compare(givenName(a.name), givenName(b.name)) || collator.compare(a.name, b.name);
    });
  }, [employees, query, dept, sort]);

  const selected = employees.find((employee) => employee.id === selectedId) ?? null;
  const totalHeld = employees.reduce((sum, employee) => sum + employee.assets.length, 0);
  const idle = employees.filter((employee) => employee.assets.length === 0).length;

  function errorText(result: Extract<EmployeeActionResult, { ok: false }>) {
    return {
      readonly: l.errReadonly,
      required: l.errRequired,
      duplicate: l.errDuplicate,
      in_use: l.errInUse,
      not_found: l.errNotFound,
    }[result.error];
  }

  function select(id: string) {
    const next = selectedId === id ? null : id;
    setSelectedId(next);
    if (next && window.matchMedia("(max-width: 1000px)").matches) {
      requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  }

  async function takeBack(employee: EmployeeRow, asset: HeldAsset) {
    if (!window.confirm(fill(l.takeBackConfirm, { code: asset.code, name: asset.name }))) return;
    const before = employees;
    // Optimistic: the row updates immediately, the server catches up.
    setEmployees((list) =>
      list.map((e) => (e.id === employee.id ? { ...e, assets: e.assets.filter((a) => a.id !== asset.id) } : e)),
    );
    try {
      const result = await returnAssetToStorage(asset.id);
      if (!result.ok) {
        setEmployees(before);
        setToast(result.error === "readonly" ? l.errReadonly : l.errNotFound);
        return;
      }
      setToast(fill(l.toastReturned, { code: asset.code }));
      startRefresh(() => router.refresh());
    } catch {
      setEmployees(before);
      setToast(l.errGeneric);
    }
  }

  const summaryParts = fill(l.summary, { n: "\u0000", assets: "\u0001", idle: "\u0002" }).split(/([\u0000-\u0002])/);
  const summaryValues: Record<string, number> = { "\u0000": employees.length, "\u0001": totalHeld, "\u0002": idle };

  return (
    <div className="emp">
      <div className="emp-top">
        <div>
          <h1>{l.colEmployee}</h1>
          <p className="emp-summary">
            {summaryParts.map((part, index) =>
              part in summaryValues ? <b key={index}>{summaryValues[part]}</b> : <span key={index}>{part}</span>,
            )}
          </p>
        </div>
        {canManage ? (
          <button className="button button-primary" type="button" onClick={() => setDialog({ mode: "add" })}>
            <Plus size={16} aria-hidden="true" />
            {l.add}
          </button>
        ) : null}
      </div>

      <div className="emp-toolbar">
        <label className="emp-search">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={l.search}
            aria-label={l.searchLabel}
          />
        </label>
        <div className="emp-chips" role="group" aria-label={l.deptFilter}>
          <button className="emp-chip" type="button" aria-pressed={dept === ALL} onClick={() => setDept(ALL)}>
            {l.all}
            <span>{employees.length}</span>
          </button>
          {deptCounts.map(([key, count]) => (
            <button
              key={key}
              className="emp-chip"
              type="button"
              aria-pressed={dept === key}
              onClick={() => setDept(key)}
            >
              {key === NO_DEPT ? l.noDept : key}
              <span>{count}</span>
            </button>
          ))}
        </div>
        <select
          className="emp-sort"
          value={sort}
          onChange={(event) => setSort(event.target.value as SortKey)}
          aria-label={l.sortLabel}
        >
          <option value="given">{l.sortGiven}</option>
          <option value="code">{l.sortCode}</option>
          <option value="holds">{l.sortHolds}</option>
        </select>
      </div>

      <div className="emp-layout">
        <div className="emp-list" role="listbox" aria-label={l.colEmployee}>
          <div className="emp-row emp-head" role="presentation">
            <span>{l.colEmployee}</span>
            <span>{l.colCode}</span>
            <span>{l.colDept}</span>
            <span>{l.colHolds}</span>
          </div>

          {employees.length === 0 ? (
            <div className="emp-empty">
              <strong>{l.emptyTitle}</strong>
              {canManage ? <span>{l.emptyHelp}</span> : null}
            </div>
          ) : rows.length === 0 ? (
            <div className="emp-empty">{query ? fill(l.noMatch, { q: query }) : l.noMatchFilter}</div>
          ) : (
            rows.map((employee) => (
              <button
                key={employee.id}
                type="button"
                role="option"
                aria-selected={selectedId === employee.id}
                className="emp-row"
                onClick={() => select(employee.id)}
              >
                <span className="emp-who">
                  <span className="emp-av" aria-hidden="true">
                    {getInitials(employee.name)}
                  </span>
                  <span className="emp-who-text">
                    <strong>{employee.name}</strong>
                    <small>{employee.email || l.noEmail}</small>
                  </span>
                </span>
                <span className="emp-code">{employee.employeeCode}</span>
                <span className={employee.department ? "emp-dept" : "emp-dept is-none"}>
                  {employee.department || l.none}
                </span>
                <span className="emp-holds">
                  {employee.assets.length ? (
                    <>
                      {employee.assets.slice(0, 2).map((asset) => (
                        <span className="mini-tag" key={asset.id}>
                          {asset.code}
                        </span>
                      ))}
                      {employee.assets.length > 2 ? (
                        <span className="emp-more">+{employee.assets.length - 2}</span>
                      ) : null}
                    </>
                  ) : (
                    <span className="emp-nothing">{l.holdsNothing}</span>
                  )}
                </span>
              </button>
            ))
          )}
        </div>

        <aside
          ref={panelRef}
          className={`emp-panel${selected ? "" : " is-idle"}`}
          aria-live="polite"
        >
          {selected ? (
            <>
              <div className="emp-p-head">
                <span className="emp-av emp-av-lg" aria-hidden="true">
                  {getInitials(selected.name)}
                </span>
                <div>
                  <h2>{selected.name}</h2>
                  <p>{selected.department || l.noDept}</p>
                </div>
              </div>
              <dl className="emp-p-meta">
                <dt>{l.codeShort}</dt>
                <dd className="emp-mono">{selected.employeeCode}</dd>
                <dt>{l.email}</dt>
                <dd>{selected.email || l.none}</dd>
              </dl>
              <div className="emp-p-sec">{fill(l.holdingCount, { n: selected.assets.length })}</div>
              {selected.assets.length ? (
                <ul className="emp-assets">
                  {selected.assets.map((asset) => (
                    <li key={asset.id}>
                      <span className="mini-tag">{asset.code}</span>
                      <Link className="emp-asset-text" href={`/assets/${asset.id}`}>
                        <span>{asset.name}</span>
                        {asset.since ? (
                          <small>{fill(l.since, { date: dateFormat.format(new Date(asset.since)) })}</small>
                        ) : null}
                      </Link>
                      {canManage ? (
                        <button className="emp-link-btn" type="button" onClick={() => takeBack(selected, asset)}>
                          {l.takeBack}
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="emp-panel-note">{l.holdsNothingHelp}</p>
              )}
              {canManage ? (
                <div className="emp-p-actions">
                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={() => setDialog({ mode: "edit", id: selected.id })}
                  >
                    {l.editInfo}
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="emp-panel-note">
              <strong>{l.panelEmptyTitle}</strong>
              {l.panelEmptyHelp}
            </div>
          )}
        </aside>
      </div>

      {dialog ? (
        <EmployeeDialog
          key={dialog.mode === "edit" ? dialog.id : "add"}
          employee={dialog.mode === "edit" ? employees.find((e) => e.id === dialog.id) ?? null : null}
          employees={employees}
          departments={deptCounts.map(([key]) => key).filter((key) => key !== NO_DEPT)}
          labels={l}
          errorText={errorText}
          onClose={() => setDialog(null)}
          onEditInstead={(id) => {
            setSelectedId(id);
            setDialog({ mode: "edit", id });
          }}
          onSaved={(saved, message) => {
            setEmployees((list) => {
              const exists = list.some((e) => e.id === saved.id);
              return exists ? list.map((e) => (e.id === saved.id ? { ...e, ...saved } : e)) : [...list, saved];
            });
            setSelectedId(saved.id);
            setDialog(null);
            setToast(message);
            startRefresh(() => router.refresh());
          }}
          onDeleted={(employee) => {
            setEmployees((list) => list.filter((e) => e.id !== employee.id));
            setSelectedId(null);
            setDialog(null);
            setToast(fill(l.toastDeleted, { name: employee.name }));
            startRefresh(() => router.refresh());
          }}
        />
      ) : null}

      <div className={`emp-toast${toast ? " is-shown" : ""}`} role="status" aria-live="polite">
        {toast}
      </div>
    </div>
  );
}

function EmployeeDialog({
  employee,
  employees,
  departments,
  labels: l,
  errorText,
  onClose,
  onEditInstead,
  onSaved,
  onDeleted,
}: {
  employee: EmployeeRow | null;
  employees: EmployeeRow[];
  departments: string[];
  labels: EmployeeLabels;
  errorText: (result: Extract<EmployeeActionResult, { ok: false }>) => string;
  onClose: () => void;
  onEditInstead: (id: string) => void;
  onSaved: (employee: EmployeeRow, message: string) => void;
  onDeleted: (employee: EmployeeRow) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [code, setCode] = useState(employee?.employeeCode ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"save" | "delete" | null>(null);
  const editing = Boolean(employee);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const clash = editing
    ? null
    : employees.find((e) => e.employeeCode.toUpperCase() === code.trim().toUpperCase()) ?? null;
  const deletable = employee && employee.assets.length === 0 && employee.historyCount === 0;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (clash) return;
    const data = new FormData(event.currentTarget);
    const input = {
      id: employee?.id,
      employeeCode: String(data.get("employeeCode") ?? employee?.employeeCode ?? ""),
      name: String(data.get("name") ?? ""),
      department: String(data.get("department") ?? ""),
      email: String(data.get("email") ?? ""),
    };
    setPending("save");
    setError(null);
    try {
      const result = await saveEmployee(input);
      if (!result.ok) {
        setError(errorText(result));
        return;
      }
      const name = input.name.trim().replace(/\s+/g, " ");
      onSaved(
        {
          id: result.id,
          employeeCode: input.employeeCode.trim().toUpperCase(),
          name,
          department: input.department.trim() || null,
          email: input.email.trim().toLowerCase() || null,
          historyCount: employee?.historyCount ?? 0,
          assets: employee?.assets ?? [],
        },
        fill(editing ? l.toastSaved : l.toastAdded, { name }),
      );
    } catch {
      setError(l.errGeneric);
    } finally {
      setPending(null);
    }
  }

  async function remove() {
    if (!employee || !window.confirm(fill(l.deleteConfirm, { name: employee.name }))) return;
    setPending("delete");
    setError(null);
    try {
      const result = await removeEmployee(employee.id);
      if (!result.ok) {
        setError(errorText(result));
        return;
      }
      onDeleted(employee);
    } catch {
      setError(l.errGeneric);
    } finally {
      setPending(null);
    }
  }

  return (
    <dialog ref={ref} className="emp-dialog" onClose={onClose} aria-labelledby="emp-dialog-title">
      <form onSubmit={submit}>
        <div className="emp-d-body">
          <h2 id="emp-dialog-title">{editing ? l.editTitle : l.add}</h2>
          <p>{editing ? l.editHelp : l.addHelp}</p>

          <div className="emp-grid2">
            <label className="emp-field">
              <span>{l.fieldCode}</span>
              <input
                name="employeeCode"
                className="emp-mono"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder={l.codePlaceholder}
                readOnly={editing}
                required
                autoComplete="off"
                autoFocus={!editing}
              />
            </label>
            <label className="emp-field">
              <span>{l.fieldName}</span>
              <input
                name="name"
                defaultValue={employee?.name}
                placeholder={l.namePlaceholder}
                required
                autoComplete="off"
                autoFocus={editing}
              />
            </label>
          </div>

          {clash ? (
            <div className="emp-notice" role="alert">
              {fill(l.duplicateNotice, { code: clash.employeeCode, name: clash.name })}{" "}
              <button type="button" className="emp-notice-link" onClick={() => onEditInstead(clash.id)}>
                {l.duplicateLink}
              </button>
              .
            </div>
          ) : null}

          <label className="emp-field">
            <span>
              {l.fieldDept} <em>{l.optional}</em>
            </span>
            <input
              name="department"
              list="emp-departments"
              defaultValue={employee?.department ?? ""}
              placeholder={l.deptPlaceholder}
              autoComplete="off"
            />
            <datalist id="emp-departments">
              {departments.map((department) => (
                <option value={department} key={department} />
              ))}
            </datalist>
          </label>
          <label className="emp-field">
            <span>
              {l.fieldEmail} <em>{l.optional}</em>
            </span>
            <input
              name="email"
              type="email"
              defaultValue={employee?.email ?? ""}
              placeholder={l.emailPlaceholder}
              autoComplete="off"
            />
          </label>

          {error ? (
            <p className="emp-error" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="emp-d-foot">
          {deletable ? (
            <button className="emp-link-btn is-danger" type="button" onClick={remove} disabled={pending !== null}>
              <Trash2 size={14} aria-hidden="true" />
              {pending === "delete" ? l.saving : l.delete}
            </button>
          ) : null}
          <span className="emp-d-spacer" />
          <button className="button button-secondary" type="button" onClick={() => ref.current?.close()}>
            {l.cancel}
          </button>
          <button className="button button-primary" type="submit" disabled={Boolean(clash) || pending !== null}>
            {pending === "save" ? l.saving : editing ? l.save : l.add}
          </button>
        </div>
      </form>
    </dialog>
  );
}
