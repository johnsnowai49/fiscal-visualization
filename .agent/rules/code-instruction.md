---
trigger: always_on
---

# AI Trader Coding Instructions: Simplicity & Efficiency First

## I. Core Philosophy: The KISS Principle

**Rule 0.1: Code is a Tool, Not a Trophy.** The primary goal of your code is to execute the statistical analysis correctly and efficiently. Avoid complex design patterns or clever tricks where a straightforward script will suffice.

**Rule 0.2: Readability Over Abstraction.** Prioritize clarity. If a feature can be implemented using a simple function instead of a complex class hierarchy, **choose the function**. Code should be self-explanatory to minimize long-term maintenance overhead.

---

## II. Data Processing and Performance

Given the requirement to process **10 years of daily data** and concurrent minute data accumulation, performance is non-negotiable.

### 1. Vectorization and Libraries
* **Rule 1.1: Vectorization Mandatory.** For calculating **Moving Averages, RSI, $\sigma$**, or any statistical metrics across the DataFrame, you **must** use **Pandas or NumPy vectorization** methods. Explicit Python loops over DataFrame rows are strictly forbidden for calculation tasks.
* **Rule 1.2: Database Efficiency.** When interacting with **PostgreSQL**, prioritize **batch operations** and **raw SQL statements** over object-relational mappers (ORMs) for massive data reading and writing tasks (e.g., the 10-year initial data dump).

### 2. Optimization and Dependencies
* **Rule 1.3: Pragmatic Optimization.** Only optimize code sections that have been proven, through profiling, to be a **bottleneck**. Do not engage in premature optimization.
* **Rule 1.4: Minimal Dependencies.** Introduce new third-party libraries only if they solve a problem that cannot be reasonably addressed by Python's standard library or your existing core libraries (Pandas, NumPy, SQLAlchemy).

---

## III. Structure and Maintenance

### 1. Functionality and Abstraction
* **Rule 2.1: Single Responsibility (Practical).** Each function or module should have one primary responsibility (e.g., one script for VAP calculation, one function for RSI calculation). Do not create unnecessary wrapper classes or abstraction layers that complicate the data flow (Data $\rightarrow$ Indicator $\rightarrow$ Signal).
* **Rule 2.2: Consistent Structure.** Maintain consistent naming conventions (e.g., snake\_case for variables and functions) across all analysis scripts.

### 2. Documentation and Error Handling
* **Rule 2.3: Comments Explain 'Why'.** Comments should explain the non-obvious **"why"** behind a design choice or approximation (e.g., explaining the **Weighted Volume Distribution** for VAP). Do not write comments explaining simple logic.
* **Rule 2.4: External Robustness.** Implement robust error handling (try/except blocks) only for **external dependencies** (e.g., database connection failures, `yfinance` API calls, external file I/O). Allow core statistical calculation errors to fail fast, as this usually indicates a data integrity issue that needs investigation.