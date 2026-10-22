# WebTrak UI identity

Preserve the WebTrak brand. Primary blue is **#3A56D4**, hover **#2E46B8**, pressed **#263A9C**, and navy **#182159**. Do not replace the brand with a different hue. Dark mode uses a lighter blue for legibility. The existing WebTrak logo stays intact.

`src/app/workspace.css` defines the workspace treatment on top of the existing semantic tokens. Use those tokens rather than introducing unrelated colors in individual pages. Status colors remain semantic: green for success, amber for attention, rose for errors.

- Light navigation, restrained blue selection, clear group labels and collapsible sections. Dark mode uses a navy navigation surface.
- Neutral blue-gray canvas, white surfaces, restrained borders and rounded corners.
- Plus Jakarta Sans headings and Inter body text; strong page headings, quiet descriptions, tabular numbers.
- Clear primary actions, comfortable controls, keyboard focus, responsive wrapping and horizontally scrollable data tables.
- Home uses a quiet typographic greeting with one action zone, a single shortcut strip, a full-width update, and cards with consistent icon headers.
- Knot remains blue with gold loops. Its SVG is shared by the interactive pet, loaders, and error states. Preserve all moods, seasonal accessories, pointer tracking, drag behavior and reduced-motion support.

Shared components (`PageHero`, `HomeCard`, `MetricCard`, `ManagementListCard`, `DataTable` / `RecordList`, `SearchInput`, buttons and `uiLayout`) carry the design across workflows. ProjectCollection replaces the old project spreadsheet, while SettingsNavigation divides preference sections. Keep business rules, permissions, routes, and API behavior independent of visual styling.

## Companions and motion

The device-local picker offers Knot, Virat Kohli fan art, Goku, Pikachu, and Charmander. Character art is vector-based and independent of the shared physics controller. Walking leg motion is driven by the actual physics mode; celebrations, gaze, idle breathing, drag/throw, sleep, and reduced motion remain shared. No speech bubbles or floating chat controls. Use right-click, long-press, or Shift+F10 for pet options; Settings provides the discoverable picker. Pause walking while options are open.

## Responsive navigation and live counts

Desktop users can choose a full sidebar or an 80px section rail. The compact rail uses section icons, hides disclosure arrows and nested links, and resets its scroll position. Clicking a section opens it. Below 1024px, the header opens the full drawer. Preferences persist on the device.

Successful API writes announce a data revision. Active badge queries and Home updates refresh after writes, navigation and cross-tab changes. Counts also refresh on focus and every 30 seconds. Unread notifications clear when read; approval and overdue counters represent unresolved work, so viewing a page does not erase those counts.

## Suggested next engagement features

1. **A personal Today queue:** combine upcoming meetings, overdue learning, pending approvals and unfinished time entries; each item opens the exact action.
2. **Peer recognition:** a small, optional kudos card tied to a project milestone, with recipient control over public visibility.
3. **Focus sessions:** a quiet timer connected to a selected project, with an explicit review before adding logged time.
4. **Team rituals:** opt-in weekly check-ins, lightweight polls and celebration RSVPs rather than competitive employee rankings.
5. **Personalized shortcuts:** let users pin frequent actions and arrange their own Home cards; preserve their layout across devices through preferences.
