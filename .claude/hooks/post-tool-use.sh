#!/usr/bin/env bash
# post-tool-use.sh: two jobs after every Bash or GitHub MCP tool call.
#
#   1. Append every GitHub-related call to the work folder's
#      github-actions-log.md (the existing audit trail).
#   2. Append a one-line JSON-Lines event to events.jsonl for every tool
#      call, regardless of whether it is GitHub-related (I15 raw stream).
#
# Safe by default: every write is guarded; the hook never fails the turn.

input=$(cat)
tool_name=$(printf '%s' "$input" | jq -r '.tool_name // ""' 2>/dev/null)
exit_code=$(printf '%s' "$input" | jq -r '.tool_response.exit_code // ""' 2>/dev/null)
token_count=$(printf '%s' "$input" | jq -r '.usage.total_tokens // ""' 2>/dev/null)

# Resolve action text for the GitHub audit log.
case "$tool_name" in
  mcp__github*)
    action=$(printf '%s' "$input" | jq -rc '.tool_input // {}' 2>/dev/null)
    ;;
  Bash)
    action=$(printf '%s' "$input" | jq -r '.tool_input.command // ""' 2>/dev/null)
    ;;
  *) exit 0 ;;
esac

work_dir="$CLAUDE_PROJECT_DIR/.claude/work"
[ -f "$work_dir/.current" ] || exit 0
current_id=$(cat "$work_dir/.current" 2>/dev/null)
[ -n "$current_id" ] || exit 0
[ -d "$work_dir/$current_id" ] || exit 0

# Job 1: GitHub audit log (git and gh commands only).
case "$tool_name" in
  mcp__github*)
    log="$work_dir/$current_id/github-actions-log.md"
    [ -f "$log" ] || printf '# GitHub actions log\n\n' > "$log"
    printf -- '- [%s] %s | %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$tool_name" "$action" >> "$log"
    ;;
  Bash)
    if printf '%s' "$action" | grep -qiE '(^| )(git|gh)( |$)'; then
      log="$work_dir/$current_id/github-actions-log.md"
      [ -f "$log" ] || printf '# GitHub actions log\n\n' > "$log"
      printf -- '- [%s] %s | %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$tool_name" "$action" >> "$log"
    fi
    ;;
esac

# Job 2: Raw event stream (every tool call).
lib="$CLAUDE_PROJECT_DIR/.claude/hooks/_lib/events.sh"
if [ -f "$lib" ]; then
  # shellcheck source=/dev/null
  source "$lib"
  # Truncate long input/output summaries to 200 chars each.
  input_summary="${action:0:200}"
  output_summary=$(printf '%s' "$input" \
    | jq -r '.tool_response.output // .tool_response.stderr // ""' 2>/dev/null \
    | head -c 200)
  append_event "" "$tool_name" "$input_summary" "$output_summary" \
    "$exit_code" "$token_count" ""
fi

exit 0
