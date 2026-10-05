"use client";

import { ChipMultiPicker, type ChipOption } from "@/components/audience/ChipMultiPicker";
import { AUDIENCE_COPY, AUDIENCE_SCOPE_COPY } from "@/constants/audience";
import { cn } from "@/lib/utils";
import type { AudienceOptions, AudienceScope, AudienceSpec } from "@/types/audience";

/** True when the audience says enough to send: a scope that needs a list has at least one entry. */
export function isAudienceComplete(spec: AudienceSpec): boolean {
  switch (spec.scope) {
    case "DEPARTMENT":
      return spec.departments.length > 0;
    case "PROJECT":
      return spec.project_ids.length > 0;
    case "USERS":
      return spec.user_ids.length > 0;
    default:
      return true;
  }
}

/**
 * "Who is this for?" — pick everyone, departments, projects, your team, or specific people.
 * What's offered depends on the sender's role (HR/Admin anyone, managers their own team); that comes
 * from the server, so the picker never offers something the API would refuse.
 */
export function AudiencePicker({
  options,
  value,
  onChange,
}: {
  options: AudienceOptions;
  value: AudienceSpec;
  onChange: (next: AudienceSpec) => void;
}) {
  const departments: ChipOption[] = options.departments.map((name) => ({ value: name, label: name }));
  const projects: ChipOption[] = options.projects.map((p) => ({ value: String(p.id), label: p.name, hint: p.code }));
  const people: ChipOption[] = options.people.map((p) => ({
    value: String(p.id),
    label: p.name,
    hint: [p.email, p.department].filter(Boolean).join(" · "),
  }));

  const setScope = (scope: AudienceScope) => onChange({ ...value, scope });
  const incomplete = !isAudienceComplete(value);

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium text-wt-text">{AUDIENCE_COPY.sendTo}</p>
        <div role="radiogroup" aria-label={AUDIENCE_COPY.sendTo} className="grid gap-2 sm:grid-cols-2">
          {options.scopes.map((scope) => {
            const on = value.scope === scope;
            return (
              <button
                key={scope}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setScope(scope)}
                className={cn(
                  "rounded-xl border px-3.5 py-2.5 text-left transition-colors",
                  on ? "border-[var(--wt-brand)] bg-wt-brand-soft" : "border-wt-border hover:bg-wt-surface-2"
                )}
              >
                <span className="block text-sm font-semibold text-wt-text">{AUDIENCE_SCOPE_COPY[scope].label}</span>
                <span className="block text-xs text-wt-text-muted">{AUDIENCE_SCOPE_COPY[scope].description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {value.scope === "DEPARTMENT" ? (
        <ChipMultiPicker
          label={AUDIENCE_COPY.departmentsLabel}
          options={departments}
          selected={value.departments}
          onChange={(next) => onChange({ ...value, departments: next })}
          error={incomplete ? AUDIENCE_COPY.chooseOne : undefined}
        />
      ) : null}
      {value.scope === "PROJECT" ? (
        <ChipMultiPicker
          label={AUDIENCE_COPY.projectsLabel}
          options={projects}
          selected={value.project_ids.map(String)}
          onChange={(next) => onChange({ ...value, project_ids: next.map(Number) })}
          error={incomplete ? AUDIENCE_COPY.chooseOne : undefined}
        />
      ) : null}
      {value.scope === "USERS" ? (
        <ChipMultiPicker
          label={AUDIENCE_COPY.peopleLabel}
          options={people}
          selected={value.user_ids.map(String)}
          onChange={(next) => onChange({ ...value, user_ids: next.map(Number) })}
          error={incomplete ? AUDIENCE_COPY.chooseOne : undefined}
        />
      ) : null}
      {value.scope === "TEAM" ? <p className="text-sm text-wt-text-muted">{AUDIENCE_COPY.teamHint}</p> : null}
    </div>
  );
}
