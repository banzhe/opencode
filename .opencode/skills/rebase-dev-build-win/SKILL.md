---
name: rebase-dev-build-win
description: Rebase my_dev onto the latest dev branch, resolve rebase conflicts safely, then rerun bun install and bun run build:desktop:win:prod.
compatibility: opencode
metadata:
  audience: maintainers
  workflow: git-build
---

# Rebase Dev Build Win

Use this skill when the user wants the current repository updated to the latest `dev`, wants `my_dev` rebased onto it, and then wants the Windows Electron build rerun.

## Goal

- Bring the latest `dev` commits into the local repo.
- Rebase `my_dev` onto the newest `dev` history.
- Resolve rebase conflicts end-to-end instead of stopping at the first conflict.
- Rerun `bun install` and `bun run build:desktop:win:prod` after the rebase completes.

## Workflow

1. Inspect the repo state first.

```bash
git status --short --branch
git branch --list dev my_dev
```

2. Fetch the newest remote `dev` history.

```bash
git fetch origin dev
```

3. If local `dev` exists and can be fast-forwarded cleanly, update it. If switching branches is blocked by worktree changes, do not force it and keep using `origin/dev` as the rebase base.

```bash
# only run this when `git branch --list dev` returned a local `dev`
git checkout dev
git pull --ff-only origin dev
```

4. Switch to `my_dev` and start the rebase.

```bash
git checkout my_dev
git rebase origin/dev
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

- Prefer `origin/dev` over local `dev` when local tracking state is unclear.
- This repo uses `dev` as the default branch.
- Keep the worktree intact unless the user explicitly asks for cleanup or destructive recovery.
