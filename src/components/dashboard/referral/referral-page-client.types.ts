export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  skills: string[];
  postedAt: string;
  urgency: "Urgent" | "Normal";
}

export interface JobsResponse {
  items: Job[];
  total: number;
  page: number;
  limit: number;
}
