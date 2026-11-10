# News and sharing — implementation record

This note preserves the technical decisions made during the 2026 news-system changes. It is historical release documentation, not a statement that current production behavior has been retested.

## Content sanitization

The visitor renderer and administrative services restrict rich text to permitted elements and URLs. The client-side cleaner removes scripts and unsafe attributes; server-side output sanitization remains a separate responsibility.

News photos are processed per activity record. An explicitly selected primary image takes precedence, with the first gallery image as a fallback.

## Sharing and previews

WhatsApp copy uses text derived from the article markup and preserves unordered/ordered list structure. The sharing route generates a landscape Open Graph image, with image normalization for supported Google Drive links. Portrait and square photos are displayed without forced cropping.

## Operations and regression coverage

Previous release work addressed malformed HTML excerpts, missing banner visibility caused by inconsistent status spacing, and Vercel function configuration for image-generation endpoints.

The historical project report recorded regression checks, a CI run, and specific backend deployment versions. Those are prior results only. For a new release, run the repository's current checks and inspect the live news pages, image previews, and relevant Apps Script deployment logs.

## Release checks

```bash
npm ci
npm run check
npm run build
```

Verify that the Vercel build and Apps Script backend are independently updated when necessary. Successful CI does not establish that Google Sheets content or the published Apps Script version has changed.
