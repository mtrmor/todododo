---
name: conventional-commits
description: Generates high-quality git commit messages adhering to the Conventional Commits specification (v1.0.0). Analyzes staged and unstaged git diffs to draft clear, concise, and structured commit messages. Use this skill whenever you are asked to draft, suggest, or execute a git commit, or when you need to propose a commit message for changes you or the user have made.
---

# Conventional Commits Skill

The goal of this skill is to generate commit messages that strictly adhere to the [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) specification.

## Core Rules

1. **Language**: Draft commit messages in **English** by default, as it is the standard for the Conventional Commits specification, unless the project context or the user explicitly dictates otherwise.
2. **Analysis**: Always inspect the actual git changes first:
   - Run `git status` to see what is staged/unstaged.
   - Run `git diff --cached` (for staged changes) or `git diff` (for unstaged changes) to review the exact code modifications.
3. **Imperative Mood**: The commit description must be in the imperative mood (e.g., "add feature" instead of "added feature" or "adds feature").
4. **No Period**: Do not put a period `.` at the end of the subject line (first line).

---

## Commit Message Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### 1. Type (`<type>`)
Must be one of the following:
- **feat**: A new feature for the user, not a new feature for a build script.
- **fix**: A bug fix for the user, not a fix to a build script.
- **docs**: Changes to the documentation.
- **style**: Formatting, missing semi colons, etc; no production code change.
- **refactor**: Refactoring production code, eg. renaming a variable.
- **perf**: A code change that improves performance.
- **test**: Adding missing tests, refactoring tests; no production code change.
- **build**: Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm, pnpm).
- **ci**: Changes to our CI configuration files and scripts (example scopes: Travis, Circle, GitHub Actions).
- **chore**: Other changes that don't modify src or test files (e.g., updating `.gitignore`).
- **revert**: Reverts a previous commit.

### 2. Scope (`[optional scope]`)
A scope is a noun describing a section of the codebase surrounded by parenthesis, e.g., `feat(auth): ...` or `fix(parser): ...`.
- Keep it short and specific (e.g., `auth`, `api`, `chat`, `theme`, `caching`, `deps`).
- If changes span multiple areas, either omit the scope or use a broader scope if appropriate.

### 3. Breaking Changes (`!`)
If a change introduces a breaking change:
- Place an exclamation mark `!` after the type/scope and before the colon, e.g., `feat(api)!: drop support for v1` or `refactor!: restructure database schema`.
- Add a `BREAKING CHANGE:` footer explaining what broke and how to migrate.

### 4. Body (`[optional body]`)
- Use the body to explain the **motivation** for the change and **what** it changes, rather than *how* (the diff shows how).
- Separate the body from the subject line with a blank line.

### 5. Footer (`[optional footer(s)]`)
- One or more footers can be provided, separated from the body or subject by a blank line.
- For breaking changes: `BREAKING CHANGE: <description of what broke and migration path>`.
- For referencing issues: `Refs #123`, `Closes #45`, or `Fixes #99`.

---

## Workflow for the Agent

1. **Inspect changes**:
   - Run `git diff --cached` if files are already staged.
   - Run `git diff` if files are not yet staged.
   - Run `git status` to get a high-level view of the modified files.
2. **Determine the primary type**:
   - If it's a mix of multiple types (e.g. adding a feature AND fixing a bug in an unrelated file), recommend splitting the changes into separate commits.
   - If they must be in one commit, choose the most significant type (e.g., `feat` over `chore`) or list them logically.
3. **Draft the message**:
   - Construct the `<type>(<scope>): <description>` header.
   - If appropriate, add a body explaining *why* the change was made.
   - Add footers if there are breaking changes or issue references.
4. **Present to the User**:
   - Output the drafted commit message inside a code block.
   - Present the `git commit -m "..."` command or ask if the user wants to commit it automatically.
