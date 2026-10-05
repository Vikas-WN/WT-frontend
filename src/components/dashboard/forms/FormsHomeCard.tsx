"use client";

import { ClipboardList } from "lucide-react";

import { HomeCard } from "@/components/dashboard/home/HomeCard";
import { FORM_COPY, FORM_HOME_LIMIT } from "@/constants/forms";
import { DASHBOARD_ROUTES } from "@/constants/routes";
import { useMyForms } from "@/hooks/forms/useForms";
import { cn } from "@/lib/utils";

/** Home widget: forms waiting for you, overdue ones first. */
export function FormsHomeCard() {
  const forms = useMyForms();
  const todo = (forms.data ?? []).filter((form) => !form.submitted && !form.is_closed);

  return (
    <HomeCard
      title={FORM_COPY.homeTitle}
      icon={<ClipboardList className="size-4" />}
      href={DASHBOARD_ROUTES.forms}
      cta={todo.length > 0 ? `${todo.length} to fill` : FORM_COPY.homeCta}
      featured={todo.length > 0}
    >
      {forms.isLoading ? (
        <div className="space-y-2" aria-hidden>
          <div className="h-4 w-3/4 animate-pulse rounded bg-wt-surface-3" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-wt-surface-3" />
        </div>
      ) : todo.length === 0 ? (
        <p className="text-sm text-wt-text-muted">{FORM_COPY.homeEmpty}</p>
      ) : (
        <ul className="space-y-2.5">
          {todo.slice(0, FORM_HOME_LIMIT).map((form) => (
            <li key={form.id}>
              <a href={`${DASHBOARD_ROUTES.forms}?formId=${form.id}`} className="block rounded-lg px-1 py-0.5 transition-colors hover:bg-wt-surface-2">
                <span className="block truncate text-sm font-medium text-wt-text">{form.title}</span>
                <span className={cn("block truncate text-xs", form.overdue ? "font-medium text-rose-600 dark:text-rose-400" : "text-wt-text-muted")}>
                  {form.overdue ? FORM_COPY.overdue : form.due_date ? `${FORM_COPY.due} ${form.due_date}` : `From ${form.created_by.name}`}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </HomeCard>
  );
}
