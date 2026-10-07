export interface SkillCell {
  skill: string;
  self_rating: number | null;
  webknot_rating: number | null;
  rating: number | null;
}

export interface SkillsPerson {
  user_id: number;
  name: string;
  email: string;
  emp_id: string | null;
  department: string | null;
  designation: string | null;
  skills: SkillCell[];
  /** One entry per matrix column; null where the person doesn't list that skill. */
  ratings: Array<number | null>;
  match_score: number;
  free_percent: number | null;
  projects: string[];
  free_label: string | null;
}

export interface SkillsInterpretation {
  skills: string[];
  availability: string | null;
  window_start: string | null;
  window_end: string | null;
  min_free_percent: number | null;
  min_rating: number | null;
}

export interface SkillsSearchResult {
  query: string;
  interpretation: SkillsInterpretation;
  columns: string[];
  total: number;
  people: SkillsPerson[];
  suggestions: Array<{ skill: string; people: number }>;
}
