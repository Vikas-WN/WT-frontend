export function objectKeyCandidates(objectKey: string, bucket: string): string[] {
  const normalizedKey = objectKey.replace(/^\/+/, "").trim();
  if (!normalizedKey) return [];

  const fileName = normalizedKey.split("/").pop() ?? normalizedKey;
  const parentPrefix = normalizedKey.includes("/")
    ? normalizedKey.slice(0, normalizedKey.lastIndexOf("/") + 1)
    : "";

  const candidates = [
    normalizedKey,
    `${bucket}/${normalizedKey}`,
    fileName,
    `${bucket}/${fileName}`,
    parentPrefix ? `${parentPrefix}${fileName}` : fileName,
    parentPrefix ? `${bucket}/${parentPrefix}${fileName}` : `${bucket}/${fileName}`,
  ];

  return Array.from(new Set(candidates.filter(Boolean)));
}

/** Prefix used to list alternate holiday calendar object keys for a year. */
export function holidayCalendarListPrefix(year: number | string): string {
  return `holiday-calendars/holiday_calendar_${year}`;
}
