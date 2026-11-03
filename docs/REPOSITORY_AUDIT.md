# GMAHK Galilea — quality review checklist

Source inspection date: 2026-11-03.

## Architecture and existing checks

The public viewer uses HTML, CSS, and JavaScript; the repository also includes Vercel API handlers and Google Apps Script backend sources. The README documents the distinction between visitor pages and the administrator redirect.

Root `package.json` includes `npm run check`, `npm run build`, and targeted checks for appearance, Sabbath presentation, visitor flow, scores, admin UI, and Sabbath summary.

## Review priorities

1. Preserve worship materials, schedules, and administrative access paths.
2. Validate public and admin data boundaries, particularly API proxy requests and server-side secrets.
3. Verify visitor experience on mobile: navigation, readable scripture/hymnal text, presentation mode, and media fallback.
4. Test keyboard access, text scaling, focus indicators, contrast, and reduced motion.
5. Confirm offline/cache behavior matches the README; cached data may be stale or unavailable.
6. Run `npm ci`, `npm run check`, and `npm run build` before merging code changes.

**Verification status:** Scripts and documentation inspected; tests not executed. No runtime changes in this PR.

© Kevin Oloan Simatupang.
