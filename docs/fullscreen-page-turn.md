# Fullscreen soft-page fold preview

## Revision 29

The stationary outgoing page now excludes the exact region revealed by the
incoming page. Both flat surfaces remain transparent without showing both
lyrics in the same area. The lifted surface stays solid by its renderer role,
including frames where its rotation is nearly zero. A curved corner trajectory
keeps the fold diagonal and uses the full animation duration at every width.
Text fitting, pixel font sizes, copyright bounds and navigation remain shared.

The actual-engine regression samples the revealed polygons over the animation,
requiring zero overlap and full coverage of the flat page. It also verifies
visible corner lift, both directions, completion and renderer cleanup.

## Revision 28

Songs and Bible readings now open at the full shared fit ceiling (1.35), rather
than 74% of that ceiling or a previously saved small preference. A- reduces text
within the current presentation and A+ restores the maximum safe fit. The
shared size preserves equal old/new text throughout the fold and stops above
the copyright. Reopening a reading starts at maximum fit again.

## Revision 26

Shared fitting measures the lyric and verse-label rectangles instead of the
clipped song wrapper or relying on scroll
dimensions when browser layout is available. The final lyric font is assigned
directly in pixels, with an 18px readability floor. During a turn, the original
page uses opacity instead of inherited visibility; renderer disposal always
removes the overlay in a finally block. Regression tests cover persistent scroll
overflow, explicit readable font sizing, and disposal failure cleanup.

## Revision 25

The shared text fitter allows two pixels for integer scroll/client rounding.
A fixed one-pixel measurement difference previously drove every candidate to
the minimum font scale, hiding lyrics while the unscaled verse label remained.
The regression test simulates this difference and requires readable text while
still fitting genuine overflow. Fold surfaces and the shared slide size remain.

## Revision 24

Flat page surfaces are transparent. The vendored HTML renderer marks a surface as `fold` only while its soft-page angle is nonzero; CSS gives that clipped, lifted region an opaque theme-colored paper background. Simple and bottom pages are marked `flat`. This preserves the background photograph beneath the flat plane without making the lifted paper transparent.

Bible chapters and songs now use one common safe typography ceiling, measured against every verse or verse/refrain slide in the open item. The resulting profile is cached by content, available dimensions, projector state and font-loading status. Navigation retains the common scale; A+/A- changes its proportion. Both snapshots therefore share the same size and the incoming text keeps it after the fold, including delayed fitting. Longer slides remain bounded above copyright.

Regression tests cover the real renderer's surface roles in both directions, equal scale across short and long verses, safe bounds, and persistent user resizing. No backend release is needed.

Scope: Bible and Lagu Sion presentation navigation. The requested motion is a diagonal paper corner fold, replacing the rigid rectangular rotation. Existing reading layout, content, controls, text fitting, and copyright bounds stay in place.

## Implementation

StPageFlip 2.0.7 is vendored with its MIT license. Both snapshots use `data-density="soft"`, and `showCover` stays false so neither page becomes a rigid cover. The bottom corner folds with a changing clipped polygon and moving inner/outer shadows. Desktop duration is 1500 ms; mobile is 1200 ms. Previous starts on page 1 and flips backward; Next starts on page 0 and flips forward.

The engine has no mouse handlers: the existing presentation controls trigger transitions. Its `disableFlipByClick` setting must remain false because the upstream corner guard otherwise prevents programmatic Previous in portrait mode.

The vendored renderer has one scoped modification: its animation-frame callback exits when `galileaDisposed` is set. The adapter sets that flag before destroying the temporary engine, preventing a perpetual frame loop after rapid input or closing the presentation. Resize, motion preference changes, fullscreen changes, and hidden documents cancel the layer. The layer is inert and hidden from screen readers.

Snapshots freeze resolved text sizes and the original reading frame height. The animation bounds end at the stage bottom, above copyright and controls. Site reduced motion disables it; an explicit full-motion choice takes precedence over the OS preference.

## Verification and review status

Automated tests exercise the actual vendored engine in simulated DOM geometry in both directions. They verify diagonal polygon clipping, rotation within the page plane, moving shadows, and renderer cleanup. Adapter tests also cover old/new real-text snapshots, desktop/mobile settings, rapid input, scoped presentation types, boundaries, and motion preferences. These tests do not establish visual appearance in physical Windows Chrome.

The current CSS/JS revision is `29-clip`, with service-worker shell
`galilea-v35-29-clipped-fold`. The backend and Apps Script deployment are unchanged.
