"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { useTimelogManagerOptions } from "@/hooks/timelog/useTimelogManagerOptions";
import {
  subCategoriesFor,
  subCategoryRequired,
  taskCategoriesForProject,
  TASK_CATEGORY_LABELS,
} from "@/utils/timelog/categories";
import {
  MODAL_BODY_CLASS,
  MODAL_FOOTER_CLASS,
  MODAL_HEADER_CLASS,
  MODAL_OVERLAY_CLASS,
  MODAL_PANEL_CLASS,
  SECTION_TITLE_CLASS,
} from "@/components/dashboard/ui/uiLayout";
import { cn } from "@/lib/utils";
import "./DayEntryForm.css";
import type { DayEntryFormProps } from "./DayEntryForm.types";
import type { DayTimelogEntry, DayTimelogEntryForm } from "@/hooks/timelog/useDayTimelog.types";
import { projectManagerEmailFromEntry } from "@/utils/timelog/entryManager";
import { formatEmployeePickerLabel } from "@/utils/employeePickerLabel";
import { FieldLabel } from "@/components/dashboard/ui/forms";
import { SearchableSelectCombobox } from "@/components/dashboard/ui/SearchableSelectCombobox";
import { showErrorToast } from "@/lib/toast";

function emptyForm(): DayTimelogEntryForm {
  return {
    project_code: "",
    project_name: "",
    project_manager: "",
    task_category: "",
    sub_category: "",
    description: "",
    hours: "",
  };
}

function formForEntry(entry: DayTimelogEntry | null): DayTimelogEntryForm {
  if (!entry) return emptyForm();
  return {
    project_code: entry.project_code ?? "",
    project_name: entry.project_name ?? "",
    project_manager: projectManagerEmailFromEntry(entry),
    task_category: entry.task_category ?? "",
    sub_category: entry.sub_category ?? "",
    description: entry.description ?? "",
    hours: String(entry.hours ?? ""),
  };
}

export function DayEntryForm({
  entry,
  projectOptions,
  actionLoading,
  onSave,
  onSaveAndSubmit,
  onUpdate,
  dayTotalHours,
  selectedDate,
  onCancel,
}: DayEntryFormProps) {
  const [form, setForm] = useState<DayTimelogEntryForm>(() => formForEntry(entry));
  const [pendingSave, setPendingSave] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const isNew = !entry;
  const managersQ = useTimelogManagerOptions(form.project_code || null);
  const managerOptions = useMemo(() => {
    const fetched = managersQ.data ?? [];
    const current = form.project_manager.trim().toLowerCase();
    // Keep the entry's saved manager selectable even if no longer on the project.
    if (current && !fetched.some((emp) => emp.email === current)) {
      return [{ email: current, name: current }, ...fetched];
    }
    return fetched;
  }, [managersQ.data, form.project_manager]);

  useEffect(() => {
    setForm(formForEntry(entry));
  }, [entry]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pendingSave && !pendingSubmit && !actionLoading) {
        onCancel();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onCancel, pendingSave, pendingSubmit, actionLoading]);

  // When project changes, clear an invalid manager; autofill when exactly one manager exists.
  useEffect(() => {
    if (!form.project_code) return;
    if (managersQ.isLoading || managersQ.isFetching) return;
    const fetched = managersQ.data ?? [];
    const current = form.project_manager.trim().toLowerCase();
    if (current && fetched.some((emp) => emp.email === current)) return;
    if (fetched.length === 1) {
      setForm((prev) => ({ ...prev, project_manager: fetched[0].email }));
      return;
    }
    if (current) {
      setForm((prev) => ({ ...prev, project_manager: "" }));
    }
  }, [
    form.project_code,
    form.project_manager,
    managersQ.data,
    managersQ.isLoading,
    managersQ.isFetching,
  ]);

  const taskOptions = form.project_code
    ? taskCategoriesForProject(form.project_code).map((t) => ({
        value: t,
        label: TASK_CATEGORY_LABELS[t] ?? t,
      }))
    : [];
  const subOptions =
    form.project_code && form.task_category
      ? subCategoriesFor(form.project_code, form.task_category)
      : [];
  const isSubRequired =
    form.project_code
      ? subCategoryRequired(form.project_code, form.task_category)
      : false;

  useEffect(() => {
    if (!form.project_code) {
      setForm((prev) => ({
        ...prev,
        task_category: "",
        sub_category: "",
        project_name: "",
        project_manager: "",
      }));
      return;
    }
    const cats = taskCategoriesForProject(form.project_code);
    if (cats.length && !cats.includes(form.task_category)) {
      const firstCat = cats[0];
      const subs = subCategoriesFor(form.project_code, firstCat);
      setForm((prev) => ({
        ...prev,
        task_category: firstCat,
        sub_category: subs[0] ?? "",
      }));
      return;
    }
    if (!form.task_category) return;
    const subs = subCategoriesFor(form.project_code, form.task_category);
    if (subs.length && !subs.includes(form.sub_category)) {
      setForm((prev) => ({ ...prev, sub_category: subs[0] ?? "" }));
    } else if (!subs.length && form.sub_category) {
      setForm((prev) => ({ ...prev, sub_category: "" }));
    }
  }, [form.project_code, form.task_category, form.sub_category]);

  const validate = useCallback((): string | null => {
    if (!form.project_code) return "Select a project.";
    if (!form.project_manager.trim()) return "Select a project manager.";
    if (!form.task_category) return "Select a task category.";
    if (isSubRequired && !form.sub_category) return "Select a sub category.";
    if (!form.description?.trim()) return "Description is required.";
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    if (selectedDate > todayStr) return "Cannot log time for future dates.";
    const hours = Number(form.hours);
    if (!Number.isFinite(hours) || hours <= 0) return "Enter valid hours.";
    if (hours > 24) return "Single entry cannot exceed 24 hours.";
    const existing = entry ? dayTotalHours - entry.hours : dayTotalHours;
    if (existing + hours > 24) return "Total hours for this day would exceed 24.";
    return null;
  }, [form, isSubRequired, entry, dayTotalHours, selectedDate]);

  const handleSaveAndSubmit = useCallback(() => {
    const error = validate();
    if (error) {
      showErrorToast(error);
      return;
    }
    setPendingSubmit(true);
    Promise.resolve(onSaveAndSubmit(form)).finally(() => setPendingSubmit(false));
  }, [form, validate, onSaveAndSubmit]);

  const handleSave = useCallback(() => {
    const error = validate();
    if (error) {
      showErrorToast(error);
      return;
    }
    setPendingSave(true);
    const action = isNew ? onSave(form) : onUpdate(entry!.id, form);
    Promise.resolve(action).finally(() => setPendingSave(false));
  }, [form, validate, isNew, onSave, onUpdate, entry]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={MODAL_OVERLAY_CLASS}
      role="presentation"
      onClick={() => {
        if (!pendingSave && !pendingSubmit && !actionLoading) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="day-entry-form-title"
        className={cn(MODAL_PANEL_CLASS, "wt-soft-in max-w-lg")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={MODAL_HEADER_CLASS}>
          <h2 id="day-entry-form-title" className={SECTION_TITLE_CLASS}>
            {isNew ? "Add entry" : "Edit entry"}
          </h2>
        </div>

        <div className={cn(MODAL_BODY_CLASS, "day-entry-form-body")}>
          <label className="day-entry-form-field">
            <FieldLabel label="Project" required className="day-entry-form-label" />
            <SearchableSelectCombobox
              value={form.project_code}
              onChange={(project_code) => {
                const selected = projectOptions.find((p) => p.project_code === project_code);
                setForm((prev) => ({
                  ...prev,
                  project_code,
                  project_name: selected?.project_name ?? project_code,
                  project_manager: "",
                }));
              }}
              options={projectOptions.map((p) => ({
                value: p.project_code,
                label: p.project_name,
              }))}
              placeholder="Search projects…"
              inputClassName="day-entry-form-select"
              showChevron
            />
          </label>

          {form.project_code ? (
            <label className="day-entry-form-field">
              <FieldLabel label="Project Manager" required className="day-entry-form-label" />
              <SearchableSelectCombobox
                value={form.project_manager}
                onChange={(project_manager) =>
                  setForm((prev) => ({
                    ...prev,
                    project_manager,
                  }))
                }
                disabled={managersQ.isLoading}
                loading={managersQ.isLoading}
                loadingLabel="Loading managers…"
                options={managerOptions.map((employee) => ({
                  value: employee.email,
                  label: formatEmployeePickerLabel({
                    employeeName: employee.name,
                    employeeEmail: employee.email,
                    empId: employee.employeeId,
                  }),
                }))}
                placeholder={
                  managersQ.isError
                    ? "Could not load managers"
                    : managerOptions.length
                      ? "Search project managers…"
                      : "No managers assigned to this project"
                }
                inputClassName="day-entry-form-select"
                showChevron
              />
            </label>
          ) : null}

          {form.project_code ? (
            <label className="day-entry-form-field">
              <FieldLabel label="Task Category" required className="day-entry-form-label" />
              <SearchableSelectCombobox
                value={form.task_category}
                onChange={(task_category) => {
                  const subs = subCategoriesFor(form.project_code, task_category);
                  setForm((prev) => ({
                    ...prev,
                    task_category,
                    sub_category: subs[0] ?? "",
                  }));
                }}
                options={taskOptions}
                placeholder="Search task categories…"
                inputClassName="day-entry-form-select"
                showChevron
              />
            </label>
          ) : null}

          {form.project_code && form.task_category && subOptions.length > 0 ? (
            <label className="day-entry-form-field">
              <FieldLabel
                label="Sub Category"
                required={isSubRequired}
                className="day-entry-form-label"
              />
              <SearchableSelectCombobox
                value={form.sub_category}
                onChange={(sub_category) =>
                  setForm((prev) => ({
                    ...prev,
                    sub_category,
                  }))
                }
                options={subOptions.map((value) => ({ value, label: value }))}
                placeholder="Search sub categories…"
                inputClassName="day-entry-form-select"
                showChevron
              />
            </label>
          ) : null}

          {form.project_code && form.task_category ? (
            <label className="day-entry-form-field">
              <FieldLabel label="Description" required className="day-entry-form-label" />
              <textarea
                className="day-entry-form-textarea"
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Description"
                rows={3}
              />
            </label>
          ) : null}

          {form.project_code && form.task_category ? (
            <label className="day-entry-form-field">
              <FieldLabel label="Hours" required className="day-entry-form-label" />
              <input
                type="text"
                inputMode="decimal"
                className="day-entry-form-input"
                value={form.hours}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw !== "" && !/^\d*\.?\d{0,2}$/.test(raw)) return;
                  setForm((prev) => ({ ...prev, hours: raw }));
                }}
                placeholder="0.5 - 24"
              />
            </label>
          ) : null}
        </div>

        <div className={cn(MODAL_FOOTER_CLASS, "flex-wrap sm:flex-nowrap")}>
          <Button
            variant="outline"
            size="sm"
            type="button"
            disabled={pendingSave || pendingSubmit}
            onClick={handleSave}
          >
            {pendingSave ? "Saving" : "Save Draft"}
          </Button>
          <Button
            variant="brand"
            size="sm"
            type="button"
            disabled={pendingSave || pendingSubmit}
            onClick={handleSaveAndSubmit}
          >
            {pendingSubmit ? "Submitting" : "Submit"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            type="button"
            disabled={actionLoading || pendingSave || pendingSubmit}
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
