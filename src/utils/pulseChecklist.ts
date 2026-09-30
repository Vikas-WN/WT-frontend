/**
 * The "what have I missed?" checklist for a Pulse self-review or a manager's review. Pure: given
 * what has been filled in so far it says, item by item, what is still missing and why — so the
 * screen can show it and the Submit button can rely on it. No React, no app imports.
 */

export interface ChecklistItem {
  key: string;
  label: string;
  done: boolean;
  /** What is still needed for this item, e.g. "rating and comment". Empty when done. */
  missing: string;
}

export interface ChecklistGroup {
  key: string;
  title: string;
  items: ChecklistItem[];
  /** The wizard step this group is filled in on, so a missing item can link straight to it. */
  step?: number;
}

export interface NamedItem {
  id: number;
  name: string;
}

export interface ChecklistInput {
  kpis: readonly NamedItem[];
  kpiRatings: Readonly<Record<number, number>>;
  kpiComments: Readonly<Record<number, string>>;
  /** Company Values to be rated — for a manager, only those the employee rated. */
  values: readonly NamedItem[];
  valueRatings: Readonly<Record<number, number>>;
  valueComments: Readonly<Record<number, string>>;
  /** Employee self-review only: the parts that aren't KPIs or values. */
  projects?: { required: boolean; selected: number; max: number };
  selfReviewWritten?: boolean;
  reviewer?: { required: boolean; chosen: boolean };
}

export interface ChecklistSteps {
  projects: number;
  kpis: number;
  values: number;
  selfReview: number;
  reviewer: number;
}

function hasText(value: string | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}

/** A rating is a real one only from 1 up; a 0 is the form's "not chosen yet". */
function isRated(rating: number | undefined): boolean {
  return rating != null && rating >= 1;
}

function missingParts(rated: boolean, commented: boolean): string {
  if (rated && commented) return "";
  if (!rated && !commented) return "rating and comment";
  return rated ? "comment" : "rating";
}

function explainedItems(
  prefix: string,
  items: readonly NamedItem[],
  ratings: Readonly<Record<number, number>>,
  comments: Readonly<Record<number, string>>
): ChecklistItem[] {
  return items.map((item) => {
    const rated = isRated(ratings[item.id]);
    const commented = hasText(comments[item.id]);
    return {
      key: `${prefix}:${item.id}`,
      label: item.name,
      done: rated && commented,
      missing: missingParts(rated, commented),
    };
  });
}

export function buildChecklist(input: ChecklistInput, steps?: Partial<ChecklistSteps>): ChecklistGroup[] {
  const groups: ChecklistGroup[] = [];

  if (input.projects?.required) {
    const { selected, max } = input.projects;
    const ok = selected >= 1 && selected <= max;
    groups.push({
      key: "projects",
      title: "Projects",
      step: steps?.projects,
      items: [
        {
          key: "projects",
          label: `Pick 1 to ${max} projects`,
          done: ok,
          missing: ok ? "" : selected === 0 ? "pick at least one" : `pick no more than ${max}`,
        },
      ],
    });
  }

  if (input.kpis.length > 0) {
    groups.push({
      key: "kpis",
      title: "KPIs",
      step: steps?.kpis,
      items: explainedItems("kpi", input.kpis, input.kpiRatings, input.kpiComments),
    });
  }
  if (input.values.length > 0) {
    groups.push({
      key: "values",
      title: "Company Values",
      step: steps?.values,
      items: explainedItems("value", input.values, input.valueRatings, input.valueComments),
    });
  }

  if (input.selfReviewWritten !== undefined) {
    groups.push({
      key: "self-review",
      title: "Self review",
      step: steps?.selfReview,
      items: [
        {
          key: "self-review",
          label: "Write your self review",
          done: input.selfReviewWritten,
          missing: input.selfReviewWritten ? "" : "write it",
        },
      ],
    });
  }

  if (input.reviewer?.required) {
    groups.push({
      key: "reviewer",
      title: "Reviewer",
      step: steps?.reviewer,
      items: [
        {
          key: "reviewer",
          label: "Choose an HR or Admin reviewer",
          done: input.reviewer.chosen,
          missing: input.reviewer.chosen ? "" : "choose one",
        },
      ],
    });
  }

  return groups;
}

export interface ChecklistSummary {
  done: number;
  total: number;
  remaining: number;
  complete: boolean;
}

export function summarizeChecklist(groups: readonly ChecklistGroup[]): ChecklistSummary {
  const items = groups.flatMap((group) => group.items);
  const done = items.filter((item) => item.done).length;
  return { done, total: items.length, remaining: items.length - done, complete: done === items.length };
}

/** Per-group "3/5" for a step header or badge. */
export function summarizeGroup(group: ChecklistGroup): { done: number; total: number } {
  return { done: group.items.filter((item) => item.done).length, total: group.items.length };
}
