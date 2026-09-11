"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Pencil, Plus, Search as SearchIcon, Trash2 } from "lucide-react";

import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { ContentCard } from "@/components/dashboard/ui/ContentCard";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { SectionLoading } from "@/components/dashboard/ui/SectionLoading";
import { RefreshIconButton } from "@/components/dashboard/ui/RefreshIconButton";
import { InputField, SelectField, TextAreaField } from "@/components/dashboard/ui/forms";
import { WikiContentView } from "@/components/dashboard/wiki/WikiContentView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ApiError } from "@/api/error";
import { useAuth } from "@/context/AuthContext";
import { hrmsService } from "@/services/hrms.service";
import type { WikiPageDetail, WikiPageSummary, WikiSpace } from "@/types/wiki";
import { normalizeRoles } from "@/utils/roles";
import { notifyError, notifySuccess } from "@/lib/notify";
import { toUserFriendlyApiErrorMessage } from "@/utils/userFriendlyApiError";
import { formatApiDateTimeDisplay } from "@/utils/apiDate";

type Load<T> = { status: "loading" | "done" | "error"; data: T | null };

/** File-local copy of the small async-fetch hook used across dashboard
 *  pages — see HomePageClient's own copy for why it isn't shared. */
function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []): Load<T> {
  const [state, setState] = useState<Load<T>>({ status: "loading", data: null });
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const data = await fn();
        if (alive) setState({ status: "done", data });
      } catch {
        if (alive) setState({ status: "error", data: null });
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

type View = "list" | "detail" | "form";

function initials(email: string): string {
  const name = email.split("@")[0] ?? "?";
  return name.slice(0, 2).toUpperCase();
}

export function WikiSpacePageClient({
  space,
  title,
  description,
}: {
  space: WikiSpace;
  title: string;
  description: string;
}) {
  const { user } = useAuth();
  const roles = useMemo(() => normalizeRoles(user?.roles ?? []), [user?.roles]);
  const isHrOrAdmin = roles.includes("ROLE_HR") || roles.includes("ROLE_ADMIN");
  // WIKI: everyone can write. POLICY: HR/Admin only.
  const canWrite = space === "POLICY" ? isHrOrAdmin : true;
  const myEmail = (user?.email ?? "").trim().toLowerCase();

  const [view, setView] = useState<View>("list");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState("");
  const [listTick, setListTick] = useState(0);

  const listQuery = useLoad(
    () => hrmsService.listWikiPages({ space, size: 100, category: category || undefined, search: search || undefined }),
    [space, category, search, listTick]
  );
  const categoriesQuery = useLoad(() => hrmsService.listWikiCategories(space), [space, listTick]);
  const pages: WikiPageSummary[] = listQuery.data?.data?.data ?? [];
  const categories: string[] = categoriesQuery.data?.data ?? [];

  const [selected, setSelected] = useState<WikiPageDetail | null>(null);
  const [detailStatus, setDetailStatus] = useState<"loading" | "error" | "done">("done");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<WikiPageSummary | WikiPageDetail | null>(null);
  const [deleting, setDeleting] = useState(false);

  const refreshList = useCallback(() => setListTick((t) => t + 1), []);

  const openDetail = useCallback(async (id: number) => {
    setView("detail");
    setDetailStatus("loading");
    try {
      const res = await hrmsService.getWikiPage(id);
      setSelected(res.data ?? null);
      setDetailStatus("done");
    } catch {
      setDetailStatus("error");
      notifyError("Couldn't load that page.");
    }
  }, []);

  const openNew = () => {
    setEditingId(null);
    setFormTitle("");
    setFormCategory(category || "");
    setFormContent("");
    setFormError(null);
    setView("form");
  };

  const openEdit = (page: WikiPageDetail) => {
    setEditingId(page.id);
    setFormTitle(page.title);
    setFormCategory(page.category ?? "");
    setFormContent(page.content);
    setFormError(null);
    setView("form");
  };

  const backToList = () => {
    setView("list");
    setSelected(null);
  };

  const submitForm = async () => {
    if (!formTitle.trim()) {
      setFormError("Title is required.");
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      if (editingId != null) {
        const res = await hrmsService.updateWikiPage(editingId, {
          title: formTitle.trim(),
          category: formCategory.trim() || null,
          content: formContent,
        });
        notifySuccess("Page updated.");
        setSelected(res.data ?? null);
        setView("detail");
      } else {
        const res = await hrmsService.createWikiPage({
          space,
          title: formTitle.trim(),
          category: formCategory.trim() || null,
          content: formContent,
        });
        notifySuccess("Page created.");
        setSelected(res.data ?? null);
        setView("detail");
      }
      refreshList();
    } catch (error) {
      setFormError(
        toUserFriendlyApiErrorMessage(
          error,
          error instanceof ApiError ? error.message : "Couldn't save this page."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await hrmsService.deleteWikiPage(deleteTarget.id);
      notifySuccess("Page deleted.");
      setDeleteTarget(null);
      backToList();
      refreshList();
    } catch (error) {
      notifyError(
        toUserFriendlyApiErrorMessage(
          error,
          error instanceof ApiError ? error.message : "Couldn't delete this page."
        )
      );
    } finally {
      setDeleting(false);
    }
  };

  const canDelete = (page: { author_email: string }) =>
    isHrOrAdmin || (space === "WIKI" && page.author_email.trim().toLowerCase() === myEmail);

  const categoryOptions = [
    { value: "", label: "All categories" },
    ...categories.map((c) => ({ value: c, label: c })),
  ];

  return (
    <DashboardPageShell className="wt-detail-page">
      <ContentCard>
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-wt-border px-4 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-semibold text-wt-text">{title}</h2>
            <p className="mt-1 text-sm text-wt-text-muted">{description}</p>
          </div>
          {view === "list" ? (
            <div className="flex shrink-0 items-center gap-2">
              <RefreshIconButton onClick={refreshList} loading={listQuery.status === "loading"} />
              {canWrite ? (
                <Button type="button" onClick={openNew}>
                  <Plus className="mr-1.5 size-4" /> New page
                </Button>
              ) : null}
            </div>
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={backToList}>
              <ArrowLeft className="mr-1.5 size-3.5" /> Back to list
            </Button>
          )}
        </div>

        {view === "list" ? (
          <div className="space-y-4 p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-wt-text-faint" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setSearch(searchInput.trim());
                  }}
                  onBlur={() => setSearch(searchInput.trim())}
                  placeholder="Search title or content…"
                  className="pl-9"
                />
              </div>
              <SelectField
                label="Category"
                value={category}
                onChange={setCategory}
                options={categoryOptions}
                placeholder="All categories"
                className="sm:w-56"
              />
            </div>

            {listQuery.status === "loading" ? (
              <SectionLoading label="" />
            ) : listQuery.status === "error" ? (
              <EmptyState
                title="Couldn't Load Pages"
                className="py-12"
                action={
                  <Button type="button" variant="outline" size="sm" onClick={refreshList}>
                    Try again
                  </Button>
                }
              />
            ) : pages.length === 0 ? (
              <EmptyState
                title={search || category ? "No Matching Pages" : "No Pages Yet"}
                description={
                  canWrite
                    ? "Be the first to add one."
                    : "Nothing has been published here yet."
                }
                className="py-12"
              />
            ) : (
              <ul className="divide-y divide-wt-border overflow-hidden rounded-xl border border-wt-border">
                {pages.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => void openDetail(p.id)}
                      className="flex w-full flex-col gap-1 px-4 py-3.5 text-left transition-colors hover:bg-wt-surface-2"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-wt-text">{p.title}</span>
                        {p.category ? (
                          <span className="rounded-md bg-wt-surface-2 px-1.5 py-0.5 text-[11px] font-medium text-wt-text-muted">
                            {p.category}
                          </span>
                        ) : null}
                      </div>
                      {p.excerpt ? (
                        <p className="truncate text-sm text-wt-text-muted">{p.excerpt}</p>
                      ) : null}
                      <p className="text-xs text-wt-text-faint">
                        Updated {formatApiDateTimeDisplay(p.updated_at)}
                        {p.updated_by_email ? ` by ${p.updated_by_email}` : ""}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : view === "detail" ? (
          <div className="p-4 sm:p-6">
            {detailStatus === "loading" ? (
              <SectionLoading label="" />
            ) : detailStatus === "error" || !selected ? (
              <EmptyState title="Couldn't Load This Page" className="py-12" />
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-xl font-semibold text-wt-text">{selected.title}</h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-wt-text-muted">
                      {selected.category ? (
                        <span className="rounded-md bg-wt-surface-2 px-1.5 py-0.5 font-medium">
                          {selected.category}
                        </span>
                      ) : null}
                      <span className="inline-flex items-center gap-1.5">
                        <span className="flex size-5 items-center justify-center rounded-full bg-wt-surface-3 text-[9px] font-semibold">
                          {initials(selected.author_email)}
                        </span>
                        {selected.author_email}
                      </span>
                      <span>· Updated {formatApiDateTimeDisplay(selected.updated_at)}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    {canWrite ? (
                      <Button type="button" variant="outline" size="sm" onClick={() => openEdit(selected)}>
                        <Pencil className="mr-1.5 size-3.5" /> Edit
                      </Button>
                    ) : null}
                    {canDelete(selected) ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={() => setDeleteTarget(selected)}
                        aria-label="Delete page"
                      >
                        <Trash2 className="size-3.5 text-rose-600" />
                      </Button>
                    ) : null}
                  </div>
                </div>
                <div className="rounded-xl border border-wt-border bg-wt-surface-1 p-4 sm:p-5">
                  <WikiContentView content={selected.content} />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 p-4 sm:p-6">
            <InputField label="Title" value={formTitle} onChange={setFormTitle} required />
            <InputField
              label="Category"
              value={formCategory}
              onChange={setFormCategory}
              placeholder="Optional — e.g. Engineering, Onboarding"
            />
            <TextAreaField
              label="Content"
              value={formContent}
              onChange={setFormContent}
              rows={16}
              placeholder="Plain text. Start a line with “Section 1:” for a heading, “- ” for a bullet."
            />
            {formError ? (
              <p className="text-sm text-destructive" role="alert">
                {formError}
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => (editingId != null ? setView("detail") : backToList())}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="button" onClick={() => void submitForm()} disabled={saving}>
                {saving ? "Saving…" : editingId != null ? "Save changes" : "Create page"}
              </Button>
            </div>
          </div>
        )}
      </ContentCard>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this page?"
        description={deleteTarget ? `"${deleteTarget.title}" will be removed. This can't be undone.` : ""}
        confirmLabel="Delete"
        tone="danger"
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardPageShell>
  );
}
