# Fullscreen page-turn release check

Scope: Bible and Lagu Sion presentation navigation only. The existing deployed layout, navigation, reader, content sources, and controls are preserved. Direction follows the requested book-page metaphor: Next turns left; Previous turns right.

Design read: retain Galilea's current typography, green palette, reading hierarchy, and spacing. ENERGY 3 / RHYTHM 3 remain inherited; MOTION 2 is scoped to this short, user-triggered transition. No new visual assets or invented content.

## Delivery gate

- Hard Gate PASS: actual verse/lyric snapshots, no new copy, navigation, or controls; Chromium click-through covered keyboard, swipe, both themes, mobile, and close cleanup. Existing contrast tests passed. The layer is inert, hidden from screen readers, and ends above copyright and controls. Site and system reduced motion disable it.
- Purpose-Gate PASS: paper curvature and directional rotation connect the old reading page to the new one. A continuous lighting gradient conveys curvature, while a transient shadow conveys depth. No global decoration, font changes, or unrelated animations were added.
- Liveliness PASS: declared dials follow the existing product. The verse or lyric remains the focal point; the original spacing and accent are retained. The specific book-turn gesture appears only during reading navigation.
- Craftsmanship & Quality Locks PASS: all regression checks passed with `npm run check`; actual Chromium tests exercised Bible Next/Previous in light and dark, rapid navigation, both reduced-motion settings, modal cleanup, song navigation, mobile eight-segment rendering, swipe, end boundary, theme and text sizing. No duplicate IDs or browser page errors occurred.

## Behavior and limits

The transient layer snapshots the previous content before rendering the next page. Desktop uses 14 curved strips over 760 ms; mobile uses eight over 620 ms. Rapid input replaces the active turn rather than queueing it. Resize, theme changes, fullscreen changes, hidden documents, and closing the presentation cancel it.

Unsupported animation/3D APIs fall back to the existing presentation transition. No new API requests, content-cache lifetime changes, or permanent reader styles are introduced. Service-worker shell assets include the new CSS and JavaScript.

Browser verification used Chromium with recorded real Bible and hymnal data and mocked network responses. Physical Safari/iOS devices were not tested. Production deployment status must be checked separately after pushing.

## Reading bounds correction

The projector layout inherited the site's viewport minimum height and allowed the reading main element to grow with its content. On a 1920 x 980 viewport, song 14's stage extended to y=1349 while copyright began at y=927. Constraining the reading main to its frame and removing that minimum keeps the stage at y=911, 16 px above copyright. Compact portrait projector spacing also preserves reading space inside its short 16:9 frame.

Bible/song preferences now allow A- down to 35%, including preferences saved at the previously exhausted 70% limit. Other presentation types keep their original 70% minimum. Snapshots freeze their original height so fitting styles do not resize paper content. Versioned animation asset URLs and a new service-worker shell revision avoid stale cached module files; worship data still uses its existing three-hour cache.

Hard Gate PASS: all four real verses of song 14 remained within the stage and above copyright in 16 Chromium combinations: 1920 x 980, 1366 x 768, 390 x 844, and 844 x 390; each in light/dark and normal/projector modes. A-/A+ visibly resized text and the maximum remained bounded. No browser page errors occurred.

Purpose-Gate PASS: explicit frame bounds prevent content from expanding its own measurement area; smaller preferences give the reader direct size control. A longer turn and gentler curvature make the requested page motion easier to see.

Liveliness PASS: inherited ENERGY 3 / RHYTHM 3 and scoped MOTION 2 remain unchanged; reading content, accent, and paper-turn gesture remain the focal features.

Craftsmanship & Quality Locks PASS: regression tests cover constrained projector geometry, shrinking below the previous minimum, stable repeated fitting, maximum bounds, and both reduced-motion settings. Real-browser measurements and visible running 3D transforms supplement simulated layout tests.
