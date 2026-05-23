#!/usr/bin/env bash
# session-start.sh: prints a short context summary when a session begins:
# the project, work folders touched in the last 7 days, and the wiki status.

cat > /dev/null  # consume and ignore the SessionStart JSON on stdin

proj="$CLAUDE_PROJECT_DIR"
echo "Agent team session. Project: $(basename "$proj")."

work_dir="$proj/.claude/work"
if [ -d "$work_dir" ]; then
  recent=$(find "$work_dir" -mindepth 1 -maxdepth 1 -type d -mtime -7 2>/dev/null)
  if [ -n "$recent" ]; then
    echo "Work folders active in the last 7 days:"
    while IFS= read -r d; do
      [ -n "$d" ] && echo "  - $(basename "$d")"
    done <<< "$recent"
  else
    echo "No work folders active in the last 7 days."
  fi
else
  echo "No work folders yet."
fi

log="$proj/docs/log.md"
if [ -f "$log" ]; then
  last=$(grep -E '^## \[' "$log" 2>/dev/null | tail -1)
  [ -n "$last" ] && echo "Global wiki, last operation: ${last#'## '}"
fi
exit 0
