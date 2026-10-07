export const SKILLS_QUERY_KEYS = {
  search: (query: string) => ["skills-matrix", query] as const,
};

export const SKILLS_COPY = {
  title: "Skills matrix",
  subtitle: "Ask in plain English who has a skill and when they are free. Ratings come from people's profiles — HR's rating wins over a self-rating.",
  placeholder: "e.g. who knows React and is free next month",
  search: "Search",
  examples: [
    "who knows React and is free next month",
    "python, aws at least 4 free now",
    "senior java fully free in november",
    "kubernetes",
  ],
  understoodAs: "Understood as",
  noSkills: "no skill named — showing the most common skills",
  emptyTitle: "No one matches",
  emptyBody: "Try fewer skills, a lower rating or a wider time window.",
  errorTitle: "Couldn't search right now",
  errorBody: "Please try again in a moment.",
  cards: "People",
  matrix: "Matrix",
  popular: "Popular skills",
  legend: "Rating",
  moreSkills: "more",
} as const;

export const RATING_CELL_CLASS: Record<number, string> = {
  1: "bg-rose-500/20 text-rose-800 dark:text-rose-200",
  2: "bg-orange-500/20 text-orange-800 dark:text-orange-200",
  3: "bg-amber-500/20 text-amber-800 dark:text-amber-200",
  4: "bg-lime-500/25 text-lime-800 dark:text-lime-200",
  5: "bg-emerald-500/30 text-emerald-800 dark:text-emerald-200",
};
