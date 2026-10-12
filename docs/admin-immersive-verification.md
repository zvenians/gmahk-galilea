# Admin workspace verification

Scope: the admin HTML frontend, navigation presentation, and existing news rich text field. Backend routes, Apps Script `.gs` files, permissions, workflow methods, and spreadsheet logic are unchanged.

Reading this as: a church secretariat workspace for Galilea's administrators, with a quiet Christian landscape and readable editorial surfaces; ENERGY 2 / RHYTHM 2 / MOTION 1.

## Design decisions

- Green and warm neutral surfaces follow Galilea's church identity; status colors continue to convey existing workflow states.
- A chapel and valley provide the Christian atmosphere requested by the user. The background is a static 279,730-byte WebP with no animation or dependency.
- A dark welcome surface protects text contrast against bright scenery; one frosted workspace carries operational content.
- Primary modules stay in the header; native `details` contains remaining modules with their original permission checks. Below 1180 px the header becomes a drawer.
- Existing system sans typography keeps forms legible without loading another font. Whitespace separates welcome, statistics, and actual tasks.
- Cards group records and actionable modules; dividers no longer consume statistics grid columns. No extra dashboard modules or fabricated production numbers were added.
- Dialogs and notification menus use solid surfaces. Only the current content/workbench uses backdrop blur; no looping or scroll animations were added.

## Validation evidence

- `npm run check`: PASS, including new `check-admin-editor.mjs` and all existing viewer, admin, news, media, schedule, presentation, cache, contrast, and production route checks.
- `node tests/check-backend-release.mjs` and `git diff --check`: PASS.
- Diff against baseline: no `.gs`, `api/*`, workflow, or Vercel configuration changes.
- Chrome on a separate HTTPS preview: every primary and secondary navigation module opens; light/dark switch, notifications, add news, preview, cancel, unsaved confirmation, and save-draft controls work.
- Real Chrome editing: bold, italic, underline, unordered list, ordered list, add/remove link, clear formatting, undo, and redo exercised. The active formatting buttons update.
- Saved fixture payload and reopened editor both contain `<ol><li><b><i><u><a href="https://gmahk-galilea.vercel.app/">Pelayanan Galilea</a></u></i></b></li></ol>`.
- Existing backend sanitizer roundtrip preserves supported formatting; links require HTTPS to match the unchanged backend. Chrome `div` line breaks normalize to paragraphs before persistence.
- Keyboard selection remains intact across toolbar focus. Empty formatted paragraphs remain empty for required-field validation. Cancelled invalid links cannot block the form; unchanged blur does not mark a draft dirty.
- Viewport / document widths: 1920/1905, 1366/1351, 980/965, 420/405, 320/305. No horizontal document overflow. Statistics reflow 4 → 2 → 1 columns.
- At 320 px, editor dialog is 291 px wide and rich toolbar is 259 px wide, with 44×44 px bold button. Drawer and “Lainnya” open, all modules remain reachable.
- Browser screenshot: `admin-ui-proof.jpg`, captured after loader is hidden, using explicitly labelled example data.

The preview fixture replaces transport with in-memory responses and is generated only by a per-preview build override. It is not a production admin bypass. Production `/admin` remains the authenticated Apps Script redirect. Live Google sign-in was unavailable in the test browser; a real production spreadsheet save was not performed or claimed.

## Delivery Gate

Each result applies to the changed admin UI and editor controls, not an audit of unrelated legacy screens.

### Hard bans

| Rule | Result | Evidence |
|---|---|---|
| R-02 | PASS | No placeholder marketing copy added. |
| R-03 | PASS | Five widths tested; drawer, wrapping toolbar, no horizontal overflow. |
| R-17 | PASS | Production metrics remain server supplied; fixture is labelled example data. |
| R-18 | PASS | No testimonial or social proof introduced. |
| R-23 | PASS | Existing admin/public links retained; new toolbar buttons have real actions. |
| R-24 | PASS | Every primary and secondary menu route clicked in Chrome. |
| R-25 | PASS | Existing contrast suite passes; white hero text on dark backing and header text have protected contrast. |
| R-26 | PASS | Rich text command dispatch, actual Chrome commands, selection, preview, and save/reopen verified. |
| R-27 | PASS | Existing loading, empty, error, operation, and unsaved states retained and exercised. |
| R-28 | PASS | No FAQ added. |
| R-32 | PASS | Visible focus outline, native details, keyboard text selection, Escape, and labelled editor controls. |
| R-33 | PASS | Source changes written through source patches; generator only builds isolated test HTML. |
| R-34 | PASS | Light and dark styles inspected; dark workbench rgba(12,25,17,.96), topbar rgb(20,39,27). |
| R-35 | PASS | Full checks plus actual Chrome click-through of changed controls and navigation, with screenshot. |
| R-36 | PASS | Test evidence distinguishes mocked transport from authenticated production persistence. |
| R-37 | PASS | Approved concept and explicit design read/dials guide implementation. |
| R-38 | PASS | No realistic invented production content; screenshot fixture visibly marks example data. |

### Purpose gate

| Rule | Result | Evidence |
|---|---|---|
| R-01 | PASS | Dark backing protects contrast; removed welcome gradient/stripe treatment. |
| R-04 | PASS | Retains existing module icons for calendar, media, news, and operations; bold uses B. |
| R-06 | PASS | System sans chosen for readable forms without extra font requests. |
| R-07 | PASS | No grid, dots, blueprint, or new texture. |
| R-08 | PASS | External icons retain their destination meaning; no decorative CTA arrows added. |
| R-09 | PASS | Workflow badges communicate actual states; removed decorative LIVE brand badge. |
| R-10 | PASS | One active frosted work surface; header, dialogs, notifications are solid. |
| R-12 | PASS | Record/module surfaces stay flat; elevated menus/dialogs preserve overlay hierarchy. |
| R-13 | PASS | No glow added. |
| R-14 | PASS | Welcome, compact statistics, task list, and record grid express different content roles. |
| R-19 | PASS | Static landscape, hover/focus states, existing drawer transitions; MOTION 1. |
| R-22 | PASS | Chapel landscape directly implements the user's Christian, relaxed backdrop request. |

### Liveliness

| Requirement | Result | Evidence |
|---|---|---|
| Explicit dials | PASS | ENERGY 2 / RHYTHM 2 / MOTION 1. |
| Dial consistency | PASS | Bold welcome, quieter operational workbench, restrained motion. |
| Focal point | PASS | Welcome headline on dashboard; module title and content elsewhere; textbox in editor. |
| Structural whitespace | PASS | Separate welcome, summary, tasks, and editor sections. |
| Deliberate accent | PASS | Green primary actions and active navigation. |
| Identity motif | PASS | Galilea logo and quiet chapel/valley backdrop with green operational palette. |
| Design read | PASS | Approved visual direction recorded above before release. |

### Craft and quality locks

| Rule | Result | Evidence |
|---|---|---|
| C-1 | PASS | Palette, typography, layout, scenery, and spacing reasons recorded. |
| C-2 | PASS | Changed navigation and all rich text controls exercised. |
| C-3 | PASS | No new filler sections; original admin functions remain. |
| C-4 | PASS | Both themes, five widths, keyboard focus, empty form, error link, and dirty states covered. |
| C-5 | PASS | Clear fixture limitation and actual measured results. |
| R-05 | PASS | Composition follows existing admin tasks and actual statistics. |
| R-11 | PASS | Workspace, controls, status tags, and menus have distinct restrained radii. |
| R-15 | PASS | Actions name their operations: save draft, add news, apply link. |
| R-16 | PASS | Plain Indonesian operational copy. |
| R-20 | PASS | Galilea church identity and requested Christian scenery. |
| R-21 | PASS | Existing user theme preference and functioning toggle retained. |
| R-29 | PASS | Green, warm neutrals, existing status semantics; no decorative multicolor palette. |
| R-30 | PASS | Reference informs atmosphere; actual Galilea workflows determine UI. |
| R-31 | PASS | Major design choices justified above. |

## Background asset provenance

Built-in image generation, referenced approved Galilea mockup. Final asset: `assets/admin-valley.webp`.

Prompt: Background-only, wide 16:9 painterly realistic serene green valley, misty distant hills, warm gentle morning sunlight, foliage at top corners, stone footpath at bottom, small white Christian chapel with modest cross at right middle distance; quiet central space for the interface. Reference is mood/composition only. No interface, text, typography, panels, buttons, logos, watermark, or people.
