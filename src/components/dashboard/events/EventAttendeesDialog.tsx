"use client";

import { WtFormDialog } from "@/components/allocation/WtFormDialog";
import { RSVP_OPTIONS } from "@/constants/events";
import { useEventAttendees } from "@/hooks/events/useEvents";
import type { AppEvent, RsvpChoice } from "@/types/event";

const GROUPS: ReadonlyArray<{ key: RsvpChoice | "PENDING"; label: string }> = [
  ...RSVP_OPTIONS.map((option) => ({ key: option.value, label: option.label })),
  { key: "PENDING", label: "No reply yet" },
];

/** Organiser view: everyone invited, grouped by their answer. */
export function EventAttendeesDialog({ event, onClose }: { event: AppEvent; onClose: () => void }) {
  const query = useEventAttendees(event.id);
  const attendees = query.data?.attendees ?? [];

  return (
    <WtFormDialog open title="Who's coming" description={event.title} onClose={onClose} maxWidthClass="max-w-lg">
      {query.isLoading ? (
        <p className="text-sm text-wt-text-muted">Loading…</p>
      ) : (
        <div className="space-y-5">
          {GROUPS.map((group) => {
            const people = attendees.filter((person) => (person.response ?? "PENDING") === group.key);
            return (
              <section key={group.key}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-wt-text-faint">
                  {group.label} <span className="ml-1 font-normal normal-case text-wt-text-muted">({people.length})</span>
                </h3>
                {people.length === 0 ? (
                  <p className="text-sm text-wt-text-muted">—</p>
                ) : (
                  <ul className="divide-y divide-wt-border rounded-xl border border-wt-border">
                    {people.map((person) => (
                      <li key={person.email} className="px-3 py-2">
                        <p className="text-sm font-medium text-wt-text">{person.name}</p>
                        <p className="text-xs text-wt-text-muted">
                          {[person.email, person.department].filter(Boolean).join(" · ")}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </WtFormDialog>
  );
}
