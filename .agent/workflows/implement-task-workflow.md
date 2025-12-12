---
description: Executes the coding, testing, and documentation steps for a single assigned Task ID (T-ID).
---

# 📝 Workflow: Implement Task (Code Execution)

This workflow outlines the minimalist process for implementing a task within the existing Epic branch.

---

## Steps

### Step 1: Initialization

1.  **Read Context:**
    *   Review **`@GIT_RULES_AGILE.md`** (if available) or Project Rules.
    *   Read the **Epic File** (e.g., `agile/epics/R-[R-ID].md`) to understand the specific Task requirements.
2.  **Verify Branch:** Ensure you are on the correct Epic Feature Branch (e.g., `feat/R-[R-ID]`). **Do not create new sub-branches.**

### Step 2: Planning & Task Creation

1.  **Create Task File:**
    *   Create **`agile/tasks/T-[T-ID].md`**.
    *   **MUST** strictly follow the template: **`agile/templates/template-task.md`**.
2.  **Plan:** Fill in the "Implementation Plan" section of the task file with your proposed changes.

### Step 3: Execution & Testing

1.  **Code:** Implement the changes.
2.  **Test:** Run verification steps (unit tests, manual scripts).
3.  **Document Results:** Update the "Test Result" section in **`agile/tasks/T-[T-ID].md`**.

### Step 4: Finalization

1.  **Update Implementation Plan:** Ensure `agile/tasks/T-[T-ID].md` accurately reflects what was done.
2.  **Update Epic Checklist:**
    *   Open **`agile/epics/R-[R-ID].md`**.
    *   Mark the task as **[x]**.
3.  **Commit:**
    *   Stage all changes (Code + Task File + Epic File).
    *   Commit with format: `git commit -m "feat: [Concise Description] [T-ID]"` (or `fix:`/`chore:` as appropriate).