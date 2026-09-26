# Diagnostic: Public News Count

Status: diagnostic checkpoint only. No source-code change.

The current issue is: Admin shows 2 news items, while the public viewer shows only 1.

Required investigation before any fix:

1. Trace the complete data path:
   Google Sheet → Website.gs → Vercel/API bridge → index.html → filtering/sorting/deduplication → rendered cards.
2. Identify the exact source row(s) representing the two visible Admin news items.
3. Identify the exact payload returned by the public API for those same records.
4. Identify whether either item is removed by:
   - backend filtering
   - status/published filtering
   - date filtering
   - deduplication
   - pagination/limit
   - cache
   - frontend filtering
   - frontend rendering error
5. Do not assume the cause is UI-only or API-only.
6. Do not modify production source code until the root cause is proven.
7. Do not claim PASS unless the evidence demonstrates that both records travel through every layer and are rendered.
8. Preserve all existing News System functionality: rich text, primary photo, slideshow, WhatsApp share, OG image, Drive image normalization, and backward compatibility.

This file is intentionally a diagnostic checkpoint and must not be treated as a production fix.
