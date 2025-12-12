# 📚 Project Documentation Hub (agile/)

This directory serves as the centralized, human-readable hub for all project management and tracking documents. It adheres to a minimalist, Epic-Task Agile workflow to ensure clarity and traceability.

---

## 1. Document Architecture Overview

The `docs/` folder is structured to reflect the project management lifecycle, from initial request to final task execution.

| Folder | Purpose | Core Content | Tracking Level |
| :--- | :--- | :--- | :--- |
| `requests/` | **Initiation** | Original user needs and feature requests (e.g., R-00001.md). | High |
| `epics/` | **Planning/Goal Setting** | High-level project plans derived from requests. Defines the 'WHAT' and 'WHY'. | Project / Epic |
| `tasks/` | **Execution/Tracking** | The definitive list of all actionable tasks and their current status (e.g., current_tasks.md). | Task / Daily |
| `templates/`| **Maintenance** | Markdown templates for all structured documents (Request, Epic, Task). | Configuration |

---

## 2. Agile Workflow Rules (Request -> Epic -> Task)

Documents must follow a strict flow to ensure traceability, primarily driven by the Project Manager Agent (`/minimal-pm`).

### 2.1 Request Filing (`requests/`)

* **Role:** User (You) creates the initial requirement.
* **Naming Rule:** Files must use the format `R-[ID].md` (e.g., `R-00001.md`).
* **Workflow:** New files are processed by the PM Agent, which converts the request into an Epic and related Tasks.

### 2.2 Epic Definition (`epics/`)

* **Role:** PM Agent generates this document based on an approved Request.
* **Naming Rule:** Files must match the Request ID (e.g., `R-00001.md`).
* **Content Focus:** Defines the **WHY** (Rationale) and **WHAT** (Success Criteria) for a major feature block.

### 2.3 Task Tracking (`tasks/`)

* **Core File:** `current_tasks.md` is the **single source of truth** for all active task statuses.
* **ID Rule:** Tasks use the format `T-[EpicID]-[SubID]` (e.g., `T-00001-001`).
* **Workflow:** The PM Agent updates task statuses in `current_tasks.md` upon completion or status change. Individual Task Implementation Plans (if detailed) are also stored here.

---

## 3. Naming Conventions Summary

All IDs are designed for clear cross-referencing between documents.

| Document Type | ID Format | Example |
| :--- | :--- | :--- |
| **Request / Epic** | `R-[5-digit ID]` | `R-00001` |
| **Task** | `T-[EpicID]-[3-digit SubID]` | `T-00001-001` |

---