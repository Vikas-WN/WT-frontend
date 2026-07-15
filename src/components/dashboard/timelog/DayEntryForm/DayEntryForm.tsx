"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAllocationEmployees } from "@/hooks/useAllocationEmployees";
import {
  subCategoriesFor,
  subCategoryRequired,
  taskCategoriesForProject,
  TASK_CATEGORY_LABELS,
} from "@/utils/timelog/categories";
import "./DayEntryForm.css";
import type { DayEntryFormProps } from "./DayEntryForm.types";
import type { DayTimelogEntry, DayTimelogEntryForm } from "@/hooks/timelog/useDayTimelog.types";
import { projectManagerEmailFromEntry } from "@/utils/timelog/entryManager";
import { SearchableSelectCombobox } from "@/components/dashboard/ui/SearchableSelectCombobox";

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
  const [localError, setLocalError] = useState<string | null>(null);
  const [pendingSave, setPendingSave] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const isNew = !entry;
  const activeEmployeesQ = useAllocationEmployees();
  const managerOptions = useMemo(() => activeEmployeesQ.data ?? [], [activeEmployeesQ.data]);

  useEffect(() => {
    setForm(formForEntry(entry));
    setLocalError(null);
  }, [entry]);

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
    if (!form.project_name.trim()) return "Project name is required.";
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
      setLocalError(error);
      return;
    }
    setLocalError(null);
    setPendingSubmit(true);
    Promise.resolve(onSaveAndSubmit(form)).finally(() => setPendingSubmit(false));
  }, [form, validate, onSaveAndSubmit]);

  const handleSave = useCallback(() => {
    const error = validate();
    if (error) {
      setLocalError(error);
      return;
    }
    setLocalError(null);
    setPendingSave(true);
    const action = isNew ? onSave(form) : onUpdate(entry!.id, form);
    Promise.resolve(action).finally(() => setPendingSave(false));
  }, [form, validate, isNew, onSave, onUpdate, entry]);

  return (
    <div
      className="day-entry-form-overlay"
      role="presentation"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="day-entry-form-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="day-entry-form-header">
          <h2 className="day-entry-form-title">
            {isNew ? "Add entry" : "Edit entry"}
          </h2>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={onCancel}
            disabled={actionLoading}
          >
            Cancel
          </Button>
        </div>

        <div className="day-entry-form-body">
          {localError ? (
            <div className="day-entry-form-error">{localError}</div>
          ) : null}

          <label className="day-entry-form-field">
            <span className="day-entry-form-label">
              Project <span className="day-entry-form-required">*</span>
            </span>
            <SearchableSelectCombobox
              value={form.project_code}
              onChange={(project_code) => {
                const selected = projectOptions.find((p) => p.project_code === project_code);
                setForm((prev) => ({
                  ...prev,
                  project_code,
                  project_name: selected?.project_name ?? "",
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
              <span className="day-entry-form-label">
                Project Name <span className="day-entry-form-required">*</span>
              </span>
              <textarea
                className="day-entry-form-textarea"
                value={form.project_name}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    project_name: e.target.value,
                  }))
                }
                placeholder="Enter project name"
                rows={2}
              />
            </label>
          ) : null}

          {form.project_code ? (
            <label className="day-entry-form-field">
              <span className="day-entry-form-label">
                Project Manager <span className="day-entry-form-required">*</span>
              </span>
              <SearchableSelectCombobox
                value={form.project_manager}
                onChange={(project_manager) =>
                  setForm((prev) => ({
                    ...prev,
                    project_manager,
                  }))
                }
                disabled={activeEmployeesQ.isLoading}
                loading={activeEmployeesQ.isLoading}
                loadingLabel="Loading managers…"
                options={managerOptions.map((employee) => ({
                  value: employee.employeeEmail,
                  label: employee.employeeName,
                }))}
                placeholder="Search project managers…"
                inputClassName="day-entry-form-select"
                showChevron
              />
            </label>
          ) : null}

          {form.project_code ? (
            <label className="day-entry-form-field">
              <span className="day-entry-form-label">
                Task category <span className="day-entry-form-required">*</span>
              </span>
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
              <span className="day-entry-form-label">
                Sub category
                {isSubRequired ? (
                  <span className="day-entry-form-required"> *</span>
                ) : null}
              </span>
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
              <span className="day-entry-form-label">Description <span className="day-entry-form-required">*</span></span>
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
              <span className="day-entry-form-label">
                Hours <span className="day-entry-form-required">*</span>
              </span>
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

        <div className="day-entry-form-footer">
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
            disabled={actionLoading}
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
