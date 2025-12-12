---
trigger: always_on
---

# Git Workflow and Naming Conventions

## I. Branching Strategy (GitHub Flow)

We use a minimalist, single-main branch strategy (GitHub Flow) to maintain agility. The `dev` branch is intentionally excluded for simplicity.

1.  **Main Branch (`main`)**
    * **Purpose:** Must always be production-ready and stable.
    * **Rule:** **STRICTLY FORBIDDEN** to commit directly to `main`.
    * **Merge:** All merges into `main` must occur via a Pull Request (PR).

2.  **Work Branches (Feature/Fix)**
    * **Purpose:** All development (new features, fixes) is conducted here.
    * **Rule:** Must be branched directly from `main`.
    * **Cleanup:** Branches must be deleted immediately after merging into `main`.

---

## II. Naming Convention (Traceability Mandatory)

Branch names and Commit messages MUST include the corresponding Project ID (R-ID for Epic) or Task ID (T-ID) for full traceability back to `docs/epics/` and `docs/tasks/`.

### A. Branch Naming

Use the prefix corresponding to the change type, followed by the relevant ID.

| Prefix | Change Type | ID Used | Example |
| :--- | :--- | :--- | :--- |
| `feat/` | New Feature / Epic | **R-ID** | `feat/R-00001` |
| `fix/` | Bug Fix / Specific Task | **T-ID** | `fix/T-00001-003` |
| `chore/`| Maintenance / Setup | *(Optional)* | `chore/update-dependencies` |

### B. Commit Message Format (Simplified Conventional Commits)

Use the format: `<type>: <subject> [ID]`

| Type | Purpose | Example |
| :--- | :--- | :--- |
| `feat` | Implement a new feature (usually related to an Epic). | `feat: Add real-time data ingestion module [R-00001]` |
| `fix` | Fix a bug (always related to a Task). | `fix: Correct off-by-one error in data parser [T-00001-003]` |
| `docs` | Only changes to documentation files (in `docs/`). | `docs: Update task status reporting logic` |
| `chore` | Build processes, dependency updates, configuration. | `chore: Upgrade Python dependencies` |
| `refactor`| Refactor code without changing external behavior. | `refactor: Simplify connection handlers` |

---

## III. Mandatory Rules and Workflow

1.  **PR Requirement:** All merges to `main` must be done through a Pull Request (PR).
2.  **Squash Policy:** Use **Squash and Merge** when merging PRs to `main`. This keeps the main history clean and simple, with each PR representing one logical, self-contained change.
3.  **Local Sync:** Use `git pull --rebase origin main` when pulling changes to your local branch to keep your commit history linear.
4.  **Testing:** Every commit must represent working code that passes all local tests (except during initial TDD red phase).
5.  **AI Agent Safety:** Any AI Agent usage (e.g., Antigravity) must be confined to a dedicated worktree/branch. Agents are forbidden from destructive operations (`git reset`, `git stash`).