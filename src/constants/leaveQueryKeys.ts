/** Query keys for an employee's own leave figures. Everything shares the "leave" root so one
 *  invalidation after a request is created, decided or withdrawn refreshes all of it. */
export const LEAVE_QUERY_ROOT = ["leave"] as const;
export const MY_LEAVE_BALANCE_QUERY_KEY = ["leave", "my-balance"] as const;
export const MY_LEAVE_OUTLOOK_QUERY_KEY = ["leave", "my-outlook"] as const;
export const MY_LEAVE_IMPACT_QUERY_KEY = ["leave", "my-impact"] as const;

/** Balances change when a manager decides a request, which this screen isn't told about — so
 *  they are re-read soon after being looked at and whenever the window regains focus. */
export const LEAVE_FIGURES_STALE_MS = 15_000;
