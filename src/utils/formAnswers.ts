import type { AnswerValue, FormAnswers, FormQuestion } from "@/types/form";

function isBlank(value: AnswerValue | undefined): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false; // numbers and booleans (including 0 / false) are real answers
}

/** Required questions with no answer, keyed by question id. The server re-validates everything. */
export function missingRequired(questions: FormQuestion[], answers: FormAnswers): Record<string, string> {
  const missing: Record<string, string> = {};
  for (const question of questions) {
    if (question.required && isBlank(answers[question.id])) missing[question.id] = "This question is required";
  }
  return missing;
}

/** Why a form being built can't be sent yet, or null when it's ready. */
export function builderProblem(title: string, questions: FormQuestion[], minChoices: number): string | null {
  if (title.trim().length < 3) return "Give the form a title.";
  if (questions.length === 0) return "Add at least one question.";
  for (const [index, question] of questions.entries()) {
    if (!question.label.trim()) return `Question ${index + 1} needs a label.`;
    if (question.type === "SINGLE_CHOICE" || question.type === "MULTI_CHOICE") {
      const options = question.options.map((o) => o.trim()).filter(Boolean);
      if (options.length < minChoices) return `Question ${index + 1} needs at least ${minChoices} options.`;
      if (new Set(options.map((o) => o.toLowerCase())).size !== options.length) return `Question ${index + 1} has duplicate options.`;
    }
  }
  return null;
}

export function newQuestionId(): string {
  return `q${Math.random().toString(36).slice(2, 10)}`;
}
