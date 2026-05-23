---
description: Scaffold a new work folder with a brief
argument-hint: [work-id]
allowed-tools: Read, Write, Bash
---

Create a new work folder for the agent team.

1. Take the work id from `$ARGUMENTS`. If it is empty, ask Tim for a short, hyphenated id, for example `fix-login-bug`, and stop until he gives one.
2. Create the folder `.claude/work/<id>/`.
3. If `templates/brief.md` exists, copy it to `.claude/work/<id>/brief.md`. Otherwise create `brief.md` with these sections: Summary, Requirements link, Routing plan, Approved GitHub actions as an empty checklist, and a "Not pre-approved" footer that names the hard deny-list from `CLAUDE.md`. The fallback checklist must use the same six fixed phrases as the template ("Create a branch", "Commit to a branch", "Push a branch other than the main branch", "Open a pull request", "Comment on a pull request or an issue", "Create an issue"), because the safety hook matches those phrases exactly.
4. Create `.claude/work/<id>/log.md` with the heading `# Work log`.
5. Write `<id>` to `.claude/work/.current`, so the hooks know which work folder is active.
6. Tell Tim the work folder is ready, and ask him to fill in the brief's Summary and its Approved GitHub actions.
