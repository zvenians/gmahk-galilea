# Schedule source verification
Scope: Apps Script schedule selection and cache invalidation. No viewer layout, assets, navigation, or Lagu Sion changed.
Tests: npm run check, node tests/check-backend-release.mjs, git diff --check PASS.
Cases: fixed sheet takes priority over archives without requiring A1 marker; fixed-sheet edits refresh cache; unrelated edits do not; 2027 dates produce WITA timestamps and Q1 2027 labels; mixed quarters display both; empty records use current-period label.

## Delivery Gate
- R-02 PASS: revised error message uses plain wording without em dash.
- R-03 PASS: no layout changes; project regressions pass.
- R-17 PASS: period labels derived from parsed dates, tested Q1/Q2 2027.
- R-18 PASS: no people or testimonials added.
- R-23 PASS: no assets or navigation created.
- R-24 PASS: navigation unchanged by diff.
- R-25 PASS: contrast suite passes.
- R-26 PASS: no controls added; edit-trigger behavior tested.
- R-27 PASS: missing-sheet error names the correct source; empty records tested.
- R-28 PASS: no FAQ changes.
- R-32 PASS: focus and keyboard handlers unchanged.
- R-33 PASS: features written in Website.gs source with VM regression tests.
- R-34 PASS: themes unchanged; contrast suite passes both themes.
- R-35 PASS: full check suite and backend release checks pass.
- R-36 PASS: simulated date tests are identified; deployment status reported separately.
- R-37 PASS: direction is fixed-name sheet Jadwal Triwulan, as requested.
- R-38 PASS: dates and service fields come from spreadsheet records.
- R-01 PASS: no gradient or color changes.
- R-04 PASS: no icon changes.
- R-06 PASS: no typography changes.
- R-07 PASS: no background patterns added.
- R-08 PASS: no decorative arrows added.
- R-09 PASS: existing status labels retained.
- R-10 PASS: no glass panels added.
- R-12 PASS: no shadows added.
- R-13 PASS: no glow added.
- R-14 PASS: content grouping unchanged.
- R-19 PASS: no motion added; busy-interface deferral suite passes.
- R-22 PASS: no illustrations added.
- Dials PASS: existing schedule direction retained, ENERGY 2 / RHYTHM 2 / MOTION 1.
- Consistency PASS: no visual changes in diff.
- Focal point PASS: existing date hierarchy retained.
- Whitespace PASS: existing schedule columns retained.
- Accent PASS: existing green service labels retained.
- Identity PASS: Galilea branding unchanged.
- Design Read PASS: user requests logic correction, no redesign.
- C-1 PASS: fixed source prevents stale archive selection.
- C-2 PASS: edit invalidation and selection exercised by tests.
- C-3 PASS: no filler sections.
- C-4 PASS: archives, missing sheet, invalid edit events, empty and multi-quarter records tested.
- C-5 PASS: assertions exercise actual Apps Script functions.
- R-05 PASS: no composition changes.
- R-11 PASS: no radius changes.
- R-15 PASS: error names Jadwal Triwulan directly.
- R-16 PASS: no marketing copy added.
- R-20 PASS: source remains actual church service schedule.
- R-21 PASS: existing theme choice unchanged.
- R-29 PASS: palette unchanged.
- R-30 PASS: no redesign.
- R-31 PASS: fixed name selects source; record dates select period; onEdit invalidates cache.

