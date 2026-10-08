import type { PageVisit, RecordedCall, RecordedError } from "@/lib/diagnostics/recorder";

/** What the browser captures to help reproduce a problem. Everything here is also shown to the person before it is sent. */
export interface BugContext {
  captured_at: string;
  time_zone: string;
  utc_offset_minutes: number;
  locale: string;
  seconds_on_page: number;
  page: { url: string; title: string; referrer: string };
  browser: { user_agent: string; platform: string; languages: string[]; cookies_enabled: boolean };
  display: {
    viewport: string;
    screen: string;
    pixel_ratio: number;
    color_scheme: string;
    reduced_motion: boolean;
    orientation: string;
    installed_app: boolean;
  };
  network: { online: boolean; type?: string; downlink_mbps?: number; rtt_ms?: number; save_data?: boolean };
  device: { memory_gb?: number; cpu_cores?: number; touch_points: number };
  app: { release: string; theme: string };
  session: { roles: string[]; active_role: string | null };
  recent: { pages: PageVisit[]; errors: RecordedError[]; api_calls: RecordedCall[] };
}
