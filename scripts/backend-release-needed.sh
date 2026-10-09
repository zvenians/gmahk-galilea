#!/usr/bin/env bash
set -euo pipefail

changed=false
if [[ "${EVENT_NAME:-}" == "workflow_dispatch" ]]; then
  [[ "${REQUEST_DEPLOY:-false}" != "true" ]] || changed=true
elif [[ "${EVENT_NAME:-}" == "push" ]]; then
  if [[ ! "${AFTER_SHA:-}" =~ ^[a-fA-F0-9]{40}$ || ! "${BEFORE_SHA:-}" =~ ^[a-fA-F0-9]{40}$ ]]; then
    echo "Invalid commit range for backend release detection." >&2
    exit 1
  fi
  if [[ "$BEFORE_SHA" == "0000000000000000000000000000000000000000" ]]; then
    changed=true
  elif git diff --quiet "$BEFORE_SHA" "$AFTER_SHA" -- apps-script-backend .claspignore; then
    changed=false
  else
    status=$?
    if [[ "$status" != "1" ]]; then exit "$status"; fi
    changed=true
  fi
fi

echo "backend_changed=$changed" >> "${GITHUB_OUTPUT:?GITHUB_OUTPUT is required}"
echo "Apps Script release required: $changed"
