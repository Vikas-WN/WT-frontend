/** The person's private calendar subscription links. */
export interface CalendarFeedLinks {
  /** Plain https link — paste into any calendar that can "subscribe by URL". */
  https_url: string;
  /** webcal:// link — opens Apple Calendar / Outlook's subscribe dialog. */
  webcal_url: string;
  /** Opens Google Calendar's "add by URL" confirmation. */
  google_url: string;
}
