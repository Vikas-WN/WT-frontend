# Employee Engagement Features

As of 24 Sep 2026. Covers both codebases: **WT-frontend** (Next.js) and **webtrak1.0** (FastAPI). The same file lives at `docs/EMPLOYEE_ENGAGEMENT_FEATURES.md` in each repo — update both together. See `docs/ARCHITECTURE.md` for the system-wide picture these features plug into.

Two small, deliberately low-stakes "fun" features layered onto the existing Leave/Comp-off/Onboarding/Home surfaces: success confetti and celebration reactions. Neither gates any workflow — if either broke outright, nothing else in the app would stop working. (A third, Quick Polls, was built and then removed — see "Removed" below.)

| Feature | Trigger | New backend state | New frontend surface |
| --- | --- | --- | --- |
| Success confetti | Leave approved, comp-off approved/credited, onboarding completed | none | `src/lib/confetti.ts` |
| Celebration reactions | Someone's birthday/anniversary is today | `celebration_reactions` table | `TodaysCelebrationsBanner` on Home |

---

## 1. Success confetti

A one-off celebratory burst — no persisted state, no API, purely a client-side moment triggered right after a mutation succeeds.

**Frontend:** `src/lib/confetti.ts` exports `fireConfetti(options?)`. It draws a full-viewport `<canvas>` overlay, animates ~140 colored particles with gravity/drag for ~2.2s, then removes the canvas. No new npm dependency (see "Why hand-rolled" below) and no-ops under `prefers-reduced-motion` or during SSR.

Called from three places, each right after its own success path — not from a shared "on any success" hook, because only these three moments should feel celebratory:

| Call site | File |
| --- | --- |
| Leave request approved | `src/components/dashboard/leave/LeaveApprovalsPanel.tsx` (inside the Approve button's `runAction`) |
| Comp-off earn/usage request approved | `src/components/comp-off/CompOffPageClient.tsx` (inside the Approve button's `runAction`) |
| Onboarding submitted successfully | `src/components/employee-onboarding/SelfOnboardingPanel.tsx` (`submit()`, right after `hrmsService.completeMyOnboarding(fd)` resolves) |

**Why hand-rolled instead of a library:** the frontend's build environment can't run `pnpm install` to regenerate `pnpm-lock.yaml`, so adding a dependency like `canvas-confetti` risks a `pnpm install --frozen-lockfile` failure in CI/Docker with no way to verify it locally first. A ~120-line Canvas implementation avoids that risk entirely.

**Extending:** to add a fourth celebratory moment, import `fireConfetti` and call it once, synchronously after the mutation you want to celebrate resolves — don't wire it into a generic success-toast helper, or every routine save starts firing confetti.

---

## 2. Celebration reactions ("Today's Celebrations")

Builds on the pre-existing `GET /celebrations` endpoint (recurring birthdays/anniversaries, org-wide, every role) by adding: a prominent Home banner for whoever's celebrating *today*, a personal confetti moment if it's your own day, and emoji reactions teammates can leave.

### Backend

| Layer | File |
| --- | --- |
| Model | `app/models/celebration_reaction.py` — `CelebrationReaction` |
| Schema | `app/schemas/celebrations.py` — `CelebrationEntry` (extended), `CelebrationReactionCount`, `CelebrationReactionRequest` |
| Service | `app/services/celebrations_service.py` — `CelebrationsService.react()`, `_attach_reactions()` |
| API | `app/api/celebrations.py` — `POST /celebrations/react` |
| Migration | `alembic/versions/20260924_01_celebration_reactions.py` |

**Data model.** `celebration_reactions` has one row per (celebrant, kind, occurrence_year, reactor):

```
id | celebrant_user_id | kind (birthday|anniversary) | occurrence_year | reactor_user_id | emoji | created_at
```

`occurrence_year` is the calendar year of the *next* occurrence of that birthday/anniversary as computed by `next_occurrence()` — the same stable key `GET /celebrations` already derives per entry (exposed to the frontend as `CelebrationEntry.occurrence_year`). This is what makes a birthday recurring every year without needing a "which year's celebration is this reaction for" ambiguity.

Reactions are restricted to a fixed palette — `ALLOWED_REACTION_EMOJIS = ("🎉", "🎂", "❤️", "🥳")` in `celebrations_service.py` — deliberately, to avoid needing a moderation story for free-text/emoji-picker input.

**`POST /celebrations/react`** toggles: posting the same emoji you already reacted with removes it; posting a different one switches it; posting fresh adds it. One notification (`NotificationType.CELEBRATION_REACTION`, in-app only — not in `_COMPANION_EMAIL_TYPES`, so no email) goes to the celebrant, skipped when you react to your own entry.

**`GET /celebrations`** now also returns, per entry:

```json
{
  "user_id": 42,
  "occurrence_year": 2026,
  "reactions": [{ "emoji": "🎉", "count": 3 }],
  "my_reaction": "🎉"
}
```

`reactions`/`my_reaction` are only populated for entries where `days_until === 0` (`_attach_reactions()` filters to that slice before querying) — no point loading reaction data for someone's birthday six months out.

### Frontend

| Layer | File |
| --- | --- |
| Types + service methods | `src/services/hrms.service.ts` — `CelebrationEntry` (extended), `CelebrationReactionCount`, `reactToCelebration()` |
| Hook | `src/hooks/celebrations/useCelebrations.ts` — `useCelebrationsQuery()`, `useReactToCelebration()` |
| Component | `src/components/dashboard/home/TodaysCelebrationsBanner.tsx` |

`TodaysCelebrationsBanner` sits above the widget grid on Home (`HomePageClient.tsx`), independent of the customizable-dashboard widget system described in `docs/HOME_DASHBOARD_CUSTOMIZATION.md` — it's contextual (only renders when someone's celebrating today) rather than a toggleable widget.

If the signed-in user (matched by email, since `AuthUser` doesn't carry a numeric id) is among today's celebrants, the banner gets the bigger "Happy Birthday!" treatment and fires confetti once — guarded by a `sessionStorage` key (`wt-celebration-confetti-{kind}-{userId}-{year}`) so navigating back to Home later the same session doesn't refire it.

**Extending:** to add a fifth reaction emoji, add it to `ALLOWED_REACTION_EMOJIS` in `celebrations_service.py` and to `REACTION_EMOJIS` in `TodaysCelebrationsBanner.tsx` — both lists must stay in sync; nothing derives one from the other.

---

## Removed: Quick Polls

HR/Admin would publish a one-question poll, anyone could vote once, and results rendered as a live `recharts` bar chart. Backend was `app/models/poll.py` (`Poll`, `PollOption`, `PollVote`), `app/schemas/poll.py`, `app/services/poll_service.py`, `app/api/poll.py`; frontend was `src/components/dashboard/home/QuickPollCard.tsx` and `src/hooks/polls/useQuickPoll.ts`. Built the same day as the other two features in this doc, then removed at the user's request shortly after shipping. Fully deleted from both repos — the `celebration_reactions` migration originally shipped bundled with the poll tables in one file (`20260924_01_celebration_reactions_and_polls.py`); that file was rewritten to drop the poll tables and renamed to `20260924_01_celebration_reactions.py`, so there's no dangling "create polls" migration left behind either.

## Removed: Action Center

An "Action Center" feature (a combined pending-actions inbox: leave/comp-off approvals, allocation extensions, exit surveys) was built earlier the same day this doc was written, then removed at the user's request ("no use"). If you find stray references to it in git history (`app/api/action_center.py`, `ActionCenterPageClient.tsx`, `NotificationType`-adjacent code, an `action-center` nav entry) — that's why; it's fully deleted from both repos, not just hidden.
