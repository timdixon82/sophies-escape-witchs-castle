#!/usr/bin/env bash
# sync-from-template.sh: update this project's agent files with the latest
# CORE sections from the agent team template.
#
# It replaces only the content between the "BEGIN CORE" and "END CORE"
# markers. It never touches the PROJECT OVERLAY section, and never touches
# the project's docs/ wiki.
#
# Usage: scripts/sync-from-template.sh <path-to-template-repository>
set -euo pipefail

template="${1:?Usage: sync-from-template.sh <path-to-template-repository>}"
project_root="$(cd "$(dirname "$0")/.." && pwd)"

[ -d "$template/.claude/agents" ] || {
  echo "No agents directory found in the template: $template" >&2
  exit 1
}

changed=0
for tfile in "$template"/.claude/agents/*.md; do
  name="$(basename "$tfile")"
  pfile="$project_root/.claude/agents/$name"
  if [ ! -f "$pfile" ]; then
    echo "New agent in the template, not yet in this project: $name"
    continue
  fi

  # The CORE block from the template, markers included.
  core="$(awk '/<!-- BEGIN CORE -->/{f=1} f{print} /<!-- END CORE -->/{f=0}' "$tfile")"
  [ -n "$core" ] || continue

  # Replace the project file's CORE block with the template's.
  tmp="$(mktemp)"
  awk -v core="$core" '
    /<!-- BEGIN CORE -->/ {print core; skip=1; next}
    skip && /<!-- END CORE -->/ {skip=0; next}
    !skip {print}
  ' "$pfile" > "$tmp"

  if cmp -s "$pfile" "$tmp"; then
    rm -f "$tmp"
  else
    mv "$tmp" "$pfile"
    echo "Updated the CORE section of $name"
    changed=$((changed + 1))
  fi
done

echo "Sync complete. $changed agent file(s) updated. PROJECT OVERLAY sections were not touched."
echo "Review the changes, then open a pull request. Opening a pull request is a gated GitHub action."
