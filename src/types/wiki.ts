export type WikiSpace = "WIKI" | "POLICY";

export interface WikiPageSummary {
  id: number;
  space: WikiSpace;
  title: string;
  slug: string;
  category: string | null;
  excerpt: string;
  author_email: string;
  updated_by_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface WikiPageDetail extends WikiPageSummary {
  content: string;
}

export interface WikiPageCreatePayload {
  space: WikiSpace;
  title: string;
  category?: string | null;
  content?: string;
}

export interface WikiPageUpdatePayload {
  title?: string;
  category?: string | null;
  content?: string;
}

export interface PaginatedWikiPages {
  data: WikiPageSummary[];
  current_page: number;
  page_size: number;
  total_element: number;
  total_page: number;
}
