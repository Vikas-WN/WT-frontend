import type { QuestionType } from "@/types/form";

export const FORM_QUERY_KEYS = {
  mine: ["forms", "mine"] as const,
  managed: ["forms", "managed"] as const,
  detail: (id: number) => ["forms", "detail", id] as const,
  responses: (id: number) => ["forms", "responses", id] as const,
  all: ["forms"] as const,
};

export const FORM_REFRESH_MS = 60_000;
export const FORM_HOME_LIMIT = 3;
export const FORM_MAX_QUESTIONS = 50;
export const FORM_MIN_CHOICES = 2;
export const FORM_TEXT_PREVIEW_LIMIT = 5;

export const QUESTION_TYPE_OPTIONS: ReadonlyArray<{ value: QuestionType; label: string }> = [
  { value: "SHORT_TEXT", label: "Short answer" },
  { value: "LONG_TEXT", label: "Long answer" },
  { value: "SINGLE_CHOICE", label: "Choose one" },
  { value: "MULTI_CHOICE", label: "Choose several" },
  { value: "RATING", label: "Rating (1–5)" },
  { value: "YES_NO", label: "Yes / No" },
  { value: "DATE", label: "Date" },
];

export const CHOICE_TYPES: ReadonlyArray<QuestionType> = ["SINGLE_CHOICE", "MULTI_CHOICE"];

export const RATING_LABELS = ["Poor", "Below", "Meets", "Above", "Exceptional"] as const;

export const FORM_COPY = {
  pageTitle: "Forms",
  pageDescription: "Surveys, requests and sign-ups sent to you — and the ones you send.",
  tabToFill: "To fill",
  tabSent: "Sent by me",
  create: "New form",
  emptyToFillTitle: "Nothing to fill in",
  emptyToFillDescription: "Forms sent to you will show up here.",
  emptySentTitle: "No forms yet",
  emptySentDescription: "Build a form, choose who gets it, and watch the responses come in.",
  due: "Due",
  overdue: "Overdue",
  closed: "Closed",
  done: "Answered",
  fill: "Fill in",
  edit: "Edit answers",
  results: "Results",
  composerTitle: "New form",
  composerDescription: "Add your questions and choose who should answer.",
  titleLabel: "Form title",
  titlePlaceholder: "e.g. Annual day t-shirt sizes",
  descriptionLabel: "Description (optional)",
  dueLabel: "Due date (optional)",
  addQuestion: "Add question",
  send: "Send form",
  sending: "Sending…",
  submit: "Submit",
  submitting: "Saving…",
  update: "Update answers",
  required: "Required",
  closedNotice: "This form is closed, so answers can't be changed.",
  exportCsv: "Export CSV",
  remind: "Remind",
  closeForm: "Close form",
  reopenForm: "Reopen form",
  noAnswers: "No answers yet.",
  homeTitle: "Forms to fill",
  homeEmpty: "You're all caught up.",
  homeCta: "See all",
} as const;
