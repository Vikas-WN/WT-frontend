import type { AudienceSpec } from "@/types/audience";

export type QuestionType = "SHORT_TEXT" | "LONG_TEXT" | "SINGLE_CHOICE" | "MULTI_CHOICE" | "RATING" | "YES_NO" | "DATE";

export interface FormQuestion {
  id: string;
  type: QuestionType;
  label: string;
  required: boolean;
  options: string[];
}

/** An answer: text / date string, a choice, several choices, a 1-5 rating, or yes/no. */
export type AnswerValue = string | string[] | number | boolean;
export type FormAnswers = Record<string, AnswerValue>;

export type FormCategory = "SURVEY" | "FEEDBACK" | "REGISTRATION" | "REQUEST" | "COMPLIANCE" | "OTHER";

export interface FormPerson {
  name: string;
  email: string;
}

export interface FormSummary {
  id: number;
  title: string;
  description: string | null;
  category: FormCategory;
  /** dd/mm/yyyy */
  due_date: string | null;
  is_closed: boolean;
  created_by: FormPerson;
  created_at: string;
  question_count: number;
  submitted: boolean;
  submitted_at: string | null;
  overdue: boolean;
  audience: AudienceSpec | null;
  recipient_count: number | null;
  submitted_count: number | null;
}

export interface FormDetail {
  form: FormSummary;
  questions: FormQuestion[];
  my_answers: FormAnswers | null;
}

export interface FormResultEntry {
  question_id: string;
  label: string;
  type: QuestionType;
  answered: number;
  counts?: Record<string, number>;
  average?: number | null;
}

export interface FormResponseRow {
  name: string;
  email: string;
  department: string | null;
  submitted_at: string | null;
  answers: FormAnswers;
}

export interface FormResponses {
  form: FormSummary;
  questions: FormQuestion[];
  results: FormResultEntry[];
  responses: FormResponseRow[];
  pending: FormPerson[];
}

export interface FormCreatePayload {
  title: string;
  description?: string | null;
  category: FormCategory;
  questions: FormQuestion[];
  audience: AudienceSpec;
  due_date?: string | null;
  notify_by_email: boolean;
}

export interface FormUpdatePayload {
  title?: string;
  description?: string | null;
  category?: FormCategory;
  due_date?: string | null;
  is_closed?: boolean;
}
