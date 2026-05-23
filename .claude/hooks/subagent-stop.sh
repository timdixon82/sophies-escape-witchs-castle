#!/usr/bin/env bash
# subagent-stop.sh: two jobs when a subagent finishes.
#
#   1. Record the subagent completion in the work folder's log.md
#      (the existing curated decision log).
#   2. Append a one-line JSON-Lines event to events.jsonl (I15 raw stream).
#
# The "subagent completed" stub line moves to events.jsonl under I15. The
# log.md entry is kept for now during the transition; Sonja will instruct
# agents to write only decision and dispatch entries to log.md once the
# events stream is established.

input=$(cat)
reason=$(printf '%s' "$input" | jq -r '.reason // ""' 2>/dev/null)
token_count=$(printf '%s' "$input" | jq -r '.usage.total_tokens // ""' 2>/dev/null)
agent=$(printf '%s' "$input" | jq -r '.agent_name // .subagent_name // ""' 2>/dev/null)

work_dir="$CLAUDE_PROJECT_DIR/.claude/work"
[ -f "$work_dir/.current" ] || exit 0
current_id=$(cat "$work_dir/.current" 2>/dev/null)
[ -n "$current_id" ] || exit 0
[ -d "$work_dir/$current_id" ] || exit 0

# Job 1: curated log (decision and dispatch entries only).
# The stub "subagent completed" line is written here during the transition.
# Once events.jsonl is established, Sonja will remove the stub lines.
log="$work_dir/$current_id/log.md"
[ -f "$log" ] || printf '# Work log\n\n' > "$log"
if [ -n "$reason" ]; then
  printf -- '- [%s] subagent completed: %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$reason" >> "$log"
else
  printf -- '- [%s] subagent completed\n' "$(date '+%Y-%m-%d %H:%M:%S')" >> "$log"
fi

# Job 2: raw event stream.
lib="$CLAUDE_PROJECT_DIR/.claude/hooks/_lib/events.sh"
if [ -f "$lib" ]; then
  # shellcheck source=/dev/null
  source "$lib"
  reason_summary="${reason:0:200}"
  append_event "$agent" "SubagentStop" "agent-return" "$reason_summary" \
    "" "$token_count" ""
fi

exit 0
