"use client";

import { RELEASE } from "@/lib/telemetry/client";
import type { BugContext } from "@/types/bugContext";
import { safePageUrl } from "@/utils/diagnostics";
import { snapshotRecording } from "@/lib/diagnostics/recorder";

interface NetworkInformation {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

const media = (query: string) => window.matchMedia(query).matches;

function installedApp(): boolean {
  return (navigator as Navigator & { standalone?: boolean }).standalone === true || media("(display-mode: standalone)") || media("(display-mode: minimal-ui)");
}

/**
 * Everything about the browser and the last few moments that helps someone reproduce a bug: the time (with the person's time zone),
 * the page, browser and screen, the network, who they were acting as, and the last pages, errors and API calls (with request ids).
 * No page contents, no form values, no request bodies.
 */
export function captureBugContext(who: { roles: string[]; activeRole: string | null }): BugContext {
  const now = new Date();
  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  const device = navigator as Navigator & { deviceMemory?: number };
  const recording = snapshotRecording();
  return {
    captured_at: now.toISOString(),
    time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown",
    utc_offset_minutes: -now.getTimezoneOffset(),
    locale: navigator.language,
    seconds_on_page: Math.round(performance.now() / 1000),
    page: { url: safePageUrl(window.location.href), title: document.title.slice(0, 120), referrer: document.referrer ? safePageUrl(document.referrer) : "" },
    browser: { user_agent: navigator.userAgent.slice(0, 300), platform: navigator.platform || "", languages: [...navigator.languages].slice(0, 5), cookies_enabled: navigator.cookieEnabled },
    display: {
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      screen: `${window.screen.width}x${window.screen.height}`,
      pixel_ratio: window.devicePixelRatio,
      color_scheme: media("(prefers-color-scheme: dark)") ? "dark" : "light",
      reduced_motion: media("(prefers-reduced-motion: reduce)"),
      orientation: window.screen.orientation?.type ?? (window.innerWidth > window.innerHeight ? "landscape" : "portrait"),
      installed_app: installedApp(),
    },
    network: { online: navigator.onLine, type: connection?.effectiveType, downlink_mbps: connection?.downlink, rtt_ms: connection?.rtt, save_data: connection?.saveData },
    device: { memory_gb: device.deviceMemory, cpu_cores: navigator.hardwareConcurrency, touch_points: navigator.maxTouchPoints },
    app: { release: RELEASE, theme: document.documentElement.getAttribute("data-theme") ?? "default" },
    session: { roles: who.roles, active_role: who.activeRole },
    recent: { pages: recording.pages, errors: recording.errors, api_calls: recording.calls },
  };
}
