---
name: rebase-version-build-win
description: Rebase my_dev onto the latest release-tagged commit message matching `release: vX.Y.Z` or `sync release versions for vX.Y.Z`, resolve rebase conflicts safely, then rerun bun install and bun run build:desktop:win:prod.
compatibility: opencode
metadata:
  audience: maintainers
  workflow: git-build
---

# Rebase Version Build Win

Use this skill when the user wants the current repository updated to the latest release commit whose message is `release: vX.Y.Z` or `sync release versions for vX.Y.Z`, wants `my_dev` rebased onto it, and then wants the Windows Electron build rerun.

## Goal

- Find the newest commit whose message matches `release: vX.Y.Z` or `sync release versions for vX.Y.Z`.
- Rebase `my_dev` onto that commit.
- Resolve rebase conflicts end-to-end instead of stopping at the first conflict.
- Rerun `bun install` and `bun run build:desktop:win:prod` after the rebase completes.

## Workflow

1. Inspect the repo state first.

```bash
git status --short --branch
git branch --list my_dev
```

2. Fetch the newest remote history so release commits are visible locally.

```bash
git fetch origin --tags
```

3. Find the latest commit whose subject matches either supported release pattern.

```powershell
git log --all --format='%H %s' | rg '^[0-9a-f]{40} (release: v|sync release versions for v)[0-9]+\.[0-9]+\.[0-9]+$' | Select-Object -First 1
```

- If no commit matches, stop and ask the user which release commit to use.
- Use the commit hash from this command as the rebase base.
- This intentionally filters formatted `hash subject` lines instead of using `git log --grep`, so the match is subject-only and does not depend on Git's default basic-regex mode.

4. Switch to `my_dev` and start the rebase.

```bash
git checkout my_dev
git rebase <release-commit-hash>
```

5. If the rebase stops on conflicts, finish the rebase instead of leaving it half-done.

- Read the conflicted files carefully before editing.
- Preserve intended behavior from both sides when possible.
- Prefer the smallest correct merge.
- Do not drop user changes just to make the rebase continue.
- After fixing each conflicted file, stage it with `git add <file>`.
- Continue with `git rebase --continue`.
- If Git reports the current patch is empty because the change is already present, use `git rebase --skip`.
- Repeat until `git rebase --continue` finishes successfully.

6. Use these guardrails while resolving conflicts.

- Never use `git reset --hard`, `git checkout -- <file>`, or `git rebase --abort` unless the user explicitly asks.
- If the conflict is in generated output, prefer regenerating it after code conflicts are resolved.
- If the conflict is in `bun.lock`, resolve the source changes first and let `bun install` regenerate the final lockfile if needed.
- If the correct resolution is ambiguous, stop and ask one short question.

7. Verify the branch state after the rebase.

```bash
git status --short --branch
```

8. Reinstall dependencies.

```bash
bun install
```

9. Rebuild the production Windows Electron target.

```bash
bun run build:desktop:win:prod
```

10. Report the outcome.

- Summarize whether the rebase completed.
- List any conflicts that were resolved.
- Report whether `bun install` succeeded.
- Report whether `bun run build:desktop:win:prod` succeeded.
- If the build failed, include the failing command and the first actionable error.

## Notes

- The release base is discovered from commit messages, not branch names.
- Supported release commit subjects are `release: vX.Y.Z` and `sync release versions for vX.Y.Z`.
- This repo uses `dev` as the default branch, but this skill does not rebase onto it.
- Keep the worktree intact unless the user explicitly asks for cleanup or destructive recovery.
