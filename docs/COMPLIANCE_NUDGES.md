# Compliance Nudges

As of 24 Sep 2026. Covers both codebases: **WT-frontend** (Next.js) and **webtrak1.0** (FastAPI). The same file lives at `docs/COMPLIANCE_NUDGES.md` in each repo — update both together.

HR/Admin-only page (`/dashboard/compliance`) that proactively flags gaps in the active workforce — missing mandatory documents, missing personal info, and Serving Notice employees approaching their last working day with no exit survey submitted — instead of HR discovering them mid-offboarding. No new data is collected; every flag is derived from data that already exists on `users` / `user_profile` / `attrition`.

## Category model, not a flat list

There are three flag categories, and a person can appear in more than one (e.g. missing both Aadhaar *and* Date of Birth shows up once under "Missing Documents" and once under "Missing Personal Info", each with its own specific `flags` list). The page shows **one category at a time** via a tab-like filter, each independently paginated and searchable — not a single combined table. This mirrors how the underlying data is actually computed (three separate flag-building passes in `ComplianceService._build_all_flags()`) and avoids the "does this person appear twice with different reasons" confusion a merged table would create.

## Backend

| Layer | File |
| --- | --- |
| Schema | `app/schemas/compliance.py` — `ComplianceFlagItem`, `ComplianceCounts`, `ComplianceNudgesResponse` |
| Service | `app/services/compliance_service.py` — `ComplianceService` |
| API | `app/api/compliance.py` — `GET /compliance/nudges` |

**`GET /compliance/nudges?category=&page=&page_size=&q=`**

| Param | Default | Notes |
| --- | --- | --- |
| `category` | `missing_documents` | One of `missing_documents`, `missing_personal_info`, `exit_survey_pending`; anything else falls back to the default rather than 400ing |
| `page` | `0` | Zero-based, matching the rest of this app's paginated list endpoints (e.g. the Clients list) — **not** 1-based |
| `page_size` | `10` | Clamped to `[1, 100]` server-side |
| `q` | — | Case-insensitive substring match against name, email, or emp id, applied *after* the category filter, *before* pagination |

Response carries `items` (the current page, for the selected category only) plus `counts` — `{missing_documents, missing_personal_info, exit_survey_pending, total_flagged}` — computed across *all three* categories regardless of which one is currently selected, so the frontend can show live badge counts on tabs that aren't even the active one without a second request.

`ComplianceService._build_all_flags()` does one query pass over the active workforce (`ACTIVE`, `SERVING_NOTICE`) plus a second pass over Serving Notice employees near their last working day (reusing `ExitInterviewService.get_profile_flags()` — the same eligibility rules the offboarding "Resend survey" button already uses, so this page and that button never disagree about who's eligible for an exit survey). Pagination and search happen in Python after that, not in SQL — deliberately: the active workforce is not large enough for this to matter, and it keeps the three category branches sharing one code path instead of three near-duplicate paginated queries.

## Frontend

| Layer | File |
| --- | --- |
| Types + service method | `src/services/hrms.service.ts` — `ComplianceFlagItem`, `ComplianceCounts`, `ComplianceNudgesData`, `getComplianceNudges()` |
| Hook | `src/hooks/compliance/useComplianceNudges.ts` |
| Page | `src/components/dashboard/compliance/CompliancePageClient.tsx` |

Built with the same table/toolbar components the rest of the app's paginated list pages use (`ManagementListCard`, `ManagementListContent`, `SearchInput`, `ToolbarFilterSelect`, `ListPagination`, sticky-header `WtTable`) rather than a bespoke layout — see `src/components/dashboard/clients/ClientsPageClient.tsx` for the pattern this was modeled on. Switching category, changing the search term, or changing page size all reset `page` back to `0` (a `useEffect` on `[category, debouncedSearch, pageSize]`), the same reset-on-filter-change behavior every other paginated page in this app follows.

The "Last Working Day" column only renders for the `exit_survey_pending` category — it's meaningless for the other two and would just show empty dashes.

## History

This page previously rendered all three categories side-by-side as a 3-column card grid with no pagination — fine when the flagged counts were small, but it didn't scale and gave no way to search. It was rebuilt into the tab + paginated-table shape described above. A companion "Action Center" feature (a combined pending-actions inbox) was built the same day and then removed at the user's request — see `docs/EMPLOYEE_ENGAGEMENT_FEATURES.md`'s "Removed" section — Compliance Nudges is unrelated to it and was not affected by that removal.
