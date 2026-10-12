# Admin component refinement, 12 October 2026

Scope: UI and client interactions in `apps-script-backend/Admins.html`, continuing the approved cinematic Galilea workspace. No `.gs` file, API route, upload transport, permission rule, publication workflow, or viewer source changed.

## Design read

ENERGY 2 / RHYTHM 2 / MOTION 2. The existing chapel landscape remains static. Warm neutral panels and forest green connect the workspace to the church setting. The system font keeps forms readable without another font download. The welcome area, separate statistics, featured worship action, content records, and compact workflow rows have different roles and density.

Only the active workspace uses backdrop blur. Cards stay opaque for readable content. Dialogs, menus, and temporary feedback use shadows to establish overlay hierarchy; record cards have no hover shadow. Short dialog entrances explain where overlays appear, button presses acknowledge actions, and cover zoom indicates the record under the pointer. Reduced motion removes these movements. There is no continuous ambient animation.

## Changes

- Separate statistic cards, a prominent Susunan Ibadah action, larger operational card typography, and wrapping 44 px buttons.
- Content covers with a visible unavailable-image fallback. Summaries exclude media URLs, and footer actions use theme-aware dividers with labelled delete controls.
- Form fields, rich text toolbar, workflow steps, approval tabs, upload controls, and confirmation dialogs use the same component spacing and radius system.
- Notification icons identify the destination module. The panel has an explicit width independent of its trigger, opens with ArrowDown, closes with Escape or outside interaction, and preserves refresh-button focus.
- Buttons announce their busy state and show a spinner. Notification refresh disables repeated clicks while pending.
- Toasts include a remaining-time indicator. Hover and keyboard focus pause expiry, including when both overlap; leaving resumes the remaining time. Undo and dismissal clean up the timer.
- Destructive confirmations initially focus Batal. They retain their existing approval and persistence behavior.
- Corrected the late light-surface token override that affected dark cards.

## Verification

`npm run check`, `npm run check:admin-ui`, `node tests/check-backend-release.mjs`, and `git diff --check` pass. The interaction regression runs as part of the existing CI check command.

Actual Chromium testing used the generated fixture with explicitly labelled example records. Mock responses were held in browser memory. No example news, service request, user, or media was sent to production.

| Browser action | Result |
| --- | --- |
| Dashboard and news at 1920, 1440, 1180, 980, 620, 420, 360, 320 px, both themes | PASS: no document overflow or clipped card/button content |
| Computed card text, captions, primary action, action links, sync button | PASS: every tested text/background pair is at least 4.5:1 in both themes |
| Notification trigger and populated panel | PASS: two labelled fixture items; full 420 px desktop panel |
| Notification item | PASS: opens its actual module and closes the panel |
| ArrowDown and Escape | PASS: enters the notification controls and restores focus to the trigger |
| Notification refresh failure and empty recovery | PASS: error toast, then empty state after recovery |
| Delete record | PASS: opens confirmation; Batal receives focus; Escape cancels |
| Rich editor bold, italic, underline | PASS: actual browser formatting appears in the form payload |
| Preview, save draft, reopen | PASS: preview opens and the memory fixture preserves formatting |
| Toast hover and keyboard focus | PASS: pauses, resumes, and removes after the remaining time |
| All primary and secondary navigation modules | PASS: existing destinations open without runtime errors |
| Mobile drawer, Lainnya, editor at 320 px | PASS: usable navigation and dialog; Escape closes |
| Reduced motion | PASS: overlay animation duration reduced; timer bar hidden |
| Browser JavaScript errors | PASS: none |

Screenshots of the dashboard in both themes, populated notifications, news cards, confirmation, editor, and mobile views were inspected. The original uploaded media path and backend formatting sanitizer are covered by existing regression checks. Authenticated production Google Sheets saves were not performed in this fixture test.

## Delivery Gate

The gate covers the components and client interactions changed in this release.

| Hard gate | Status and evidence |
| --- | --- |
| R-02 | PASS: added operational text has no em dash or marketing filler |
| R-03 | PASS: eight browser widths and both themes; no horizontal or card-content overflow |
| R-17 | PASS: dashboard numbers remain backend supplied; test data is labelled |
| R-18 | PASS: no testimonials or fictional people added to production |
| R-23 | PASS: existing landscape and logos retained; no new visual asset or navigation structure |
| R-24 | PASS: every existing module was opened in Chromium |
| R-25 | PASS: actual computed card/action/button contrast checked in both themes |
| R-26 | PASS: notification, confirmation, preview, save, reopen, and navigation exercised |
| R-27 | PASS: empty content, missing image, refresh error, busy, and success states checked |
| R-28 | PASS: no FAQ added |
| R-32 | PASS: focus indicators retained; notification keyboard navigation and dialog cancellation exercised |
| R-33 | PASS: UI edits written directly in source; fixture generator is an isolated test tool |
| R-34 | PASS: light and dark card surfaces, labels, actions, and layout verified |
| R-35 | PASS: full checks, Chromium click-through, screenshot inspection, no JavaScript errors |
| R-36 | PASS: no security/performance/customer claim added; fixture persistence identified accurately |
| R-37 | PASS: approved cinematic direction and dials stated above |
| R-38 | PASS: example records remain in the labelled fixture only |

| Purpose gate | Status and evidence |
| --- | --- |
| R-01 | PASS: forest green emphasizes primary operations and warm neutrals protect readability |
| R-04 | PASS: existing calendar/news/image/service icons identify their modules; feedback icons identify state |
| R-06 | PASS: system font chosen for readable forms and no extra font request |
| R-07 | PASS: no decorative grid or texture added |
| R-08 | PASS: quick actions use named destinations; external glyphs retained only for actual external links |
| R-09 | PASS: badges describe actual workflow states or backend notification counts |
| R-10 | PASS: active workspace is the only frosted surface; overlays and cards are solid |
| R-12 | PASS: shadows reserved for topbar and overlays; record cards do not float |
| R-13 | PASS: no glow added |
| R-14 | PASS: different structure for statistics, featured worship action, media records, and workflow rows |
| R-19 | PASS: motion indicates entrances, button presses, and pointer target; reduced motion exercised |
| R-22 | PASS: existing approved chapel landscape reused |

| Liveliness | Status and evidence |
| --- | --- |
| Explicit dials | PASS: ENERGY 2 / RHYTHM 2 / MOTION 2 |
| Consistent dials | PASS: prominent welcome and worship action; quiet forms; brief functional transitions |
| Focal point | PASS: welcome and worship action on dashboard; title/content on module pages; form in editor |
| Structural whitespace | PASS: welcome, statistics, actions, toolbar, records, and form groups separated |
| Deliberate accent | PASS: forest green primary actions, active workflow, and selected formatting |
| Identity motif | PASS: Galilea chapel scenery, warm panels, and green operational palette |
| Design read | PASS: continued approved direction, documented before delivery |

| Craft and quality locks | Status and evidence |
| --- | --- |
| C-1, R-31 | PASS: palette, typography, hierarchy, motion, and elevation purposes stated above |
| C-2 | PASS: changed interactive controls exercised in browser; no new inactive action |
| C-3, R-05 | PASS: original admin tasks determine composition; no filler section |
| C-4 | PASS: both themes, mobile, keyboard, error, empty, unavailable image, and operation states checked |
| C-5 | PASS: mocked persistence and actual test scope explicitly recorded |
| R-11 | PASS: distinct control, card, overlay, and status radii |
| R-15 | PASS: named operations and named module destinations |
| R-16 | PASS: plain operational Indonesian |
| R-20 | PASS: existing church landscape and green/warm-neutral identity retained |
| R-21 | PASS: user theme preference and working toggle retained |
| R-29 | PASS: forest green and warm neutrals; semantic colors only for real states |
| R-30 | PASS: Galilea content and prior approved direction guide composition |
