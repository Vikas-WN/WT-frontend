# Home Dashboard Customization

As of 24 Sep 2026. Frontend-only (WT-frontend). The same file lives at `docs/HOME_DASHBOARD_CUSTOMIZATION.md` in each repo for discoverability alongside the other feature docs — there is no backend component to this one.

The Home dashboard's widget grid (`src/components/dashboard/home/HomePageClient.tsx`) is drag-to-reorder, resizable (normal/wide), and each widget can be hidden and re-added — a per-browser preference, not a shared/synced one.

## Why per-browser, not per-account

The layout is stored in `localStorage` (key `wt-home-dashboard-layout-v1`), not on the backend. This was a deliberate scope call: a backend-synced layout would need a preferences table, a migration, an endpoint, and a hook — for a personalization feature nobody asked to have follow them across devices. If that requirement shows up later, `useHomeDashboardLayout` (below) is the only place that would need to change — everything above it (the widget registry, the drag/resize UI) is unaware of where the layout is persisted.

## Architecture

| Piece | File | Responsibility |
| --- | --- | --- |
| Layout state | `src/hooks/dashboard/useHomeDashboardLayout.ts` | Order, size, and hidden/visible per widget id; reads/writes `localStorage` |
| Widget chrome | `src/components/dashboard/home/DashboardWidgetFrame.tsx` | Drag handle, resize toggle, hide button — shown only in edit mode |
| Restore menu | `src/components/dashboard/home/AddWidgetMenu.tsx` | Popover listing hidden-but-eligible widgets, with a button to re-show each |
| Registry + wiring | `src/components/dashboard/home/HomePageClient.tsx` | Maps each widget id to its actual rendered content + role-eligibility, and renders them in the persisted order |

### The widget catalog

Eight widget ids, defined once as `HOME_WIDGET_IDS` in `HomePageClient.tsx`:

```
attendance | approvals | leave-balance | learning | whos-out | projects | holidays | celebrations
```

(A ninth, `quick-poll`, existed briefly — see the Quick Polls removal note in `docs/EMPLOYEE_ENGAGEMENT_FEATURES.md`.)

Each has a human title in `HOME_WIDGET_TITLES` (shown in the "Add widget" menu) and an entry in `widgetRegistry` — `{ eligible: boolean, node: ReactNode }` — built fresh on every render from the same data (`attendance`, `approvals`, `balance`, …) the old hardcoded grid used. `eligible` reuses the pre-existing role checks (`isApprover`, `canSeeOrgOut`): a widget that's ineligible for the current role is filtered out of the visible grid even if the user's saved layout doesn't mark it hidden — role changes shouldn't leave a stale widget stuck on screen.

**Adding a tenth widget:** append its id to `HOME_WIDGET_IDS`, a title to `HOME_WIDGET_TITLES`, and an entry to `widgetRegistry`. `useHomeDashboardLayout`'s `reconcile()` step already handles a saved layout that predates the new id — it gets appended at the end, visible by default, the next time anyone with an existing saved layout loads the page.

### Drag to reorder

`DashboardWidgetFrame` uses the native HTML5 Drag and Drop API — no new npm dependency (same reasoning as the confetti feature: this environment can't regenerate `pnpm-lock.yaml`, so adding a library like `react-grid-layout` risks a CI install failure that can't be caught locally first).

One subtlety worth knowing if you touch this: the actual reorder only happens **on drop**, not on every `dragover` tick. `dragover` fires continuously (many times a second) while hovering, so calling `reorder(draggedId, targetId)` from it — an earlier draft of this did — made the dragged widget visibly ping-pong between two positions. `onDragOver` now only calls `preventDefault()` (required to allow a drop at all) and sets a local `isDropTarget` highlight; `onDrop` is the only thing that calls `reorder()`, exactly once per gesture.

### Resize

Not a free-form pixel resize — a discrete `normal` / `wide` toggle (`sm:col-span-2` in the `sm:grid-cols-2 xl:grid-cols-3` grid). A true resizable-grid engine (à la `react-grid-layout`) would need to solve collision/reflow for arbitrary sizes, which is a lot of surface area to get right without being able to compile-check the result locally. Two sizes covers the actual need — widgets with more content (Leave Balance, Learning) can go wide.

### Edit mode

The "Customize" button toggles `editMode`. While it's on:
- `DashboardWidgetFrame` renders a small toolbar (drag handle, resize, hide) in each widget's top-right corner
- The widget's own content gets `pointer-events-none` — so dragging a card doesn't also click through to its "Details" link mid-drag
- "Add widget" and "Reset layout" appear next to "Done"

"Reset layout" restores `HOME_WIDGET_IDS`' original order, all `normal` size, nothing hidden — it does not require confirmation, since it only affects this browser's own preference.

## Known limitations

- Touch-device drag reordering is not guaranteed — native HTML5 DnD has historically inconsistent touch support across mobile browsers. Resize and hide/show both work fine on touch (they're plain buttons); only the drag gesture is desktop-reliable.
- No layout sync across devices/browsers (see "Why per-browser" above).
- Hiding every widget renders an empty-state message rather than a blank grid, but there's no "recommended layout" or onboarding nudge steering first-time users toward the Customize button — it's discoverable only by noticing the button in the top-right.
