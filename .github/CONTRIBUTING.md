# Contributing Guidelines

Thank you for your interest in improving the **GMAHK Galilea Web Portal**.

## Development Workflow

1. **Fork or Branch:** Create a dedicated feature branch from `main` (e.g., `feat/song-search-shortcut` or `fix/hymn-layout`).
2. **Local Verification:**
   Before pushing changes, run the project verification and contrast checks:
   ``bash
   npm run check
   ``
   Ensure that:
   - All 20 API viewer proxy endpoints resolve correctly.
   - HTML syntax is valid.
   - All light and dark theme color tokens pass WCAG 2.1 AA contrast ratios (minimum 4.5:1).
3. **Commit Standards:**
   Use [Conventional Commits](https://www.conventionalcommits.org/) for clean history:
   - `feat: add new feature`
   - `fix: resolve an issue`
   - `docs: update documentation`
   - `ci: update workflow configurations`
4. **Pull Requests:**
   - Submit your pull request targeting the `main` branch.
   - Provide a clear summary of changes and verification evidence in the pull request description.
   - Automated GitHub Actions CI must pass before merging.
