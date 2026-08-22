# contracts.tasker247.com

This repository hosts the interactive, legally binding **Tasker247 Master Services Agreement** (live at [https://contracts.tasker247.com](https://contracts.tasker247.com)).

## Features

- **Dynamic Service Selection & Annexures**:
  - Automatically loads and bundles tailored service schedules (Annexure A: Compliance, Annexure B: Admin, Annexure C: Process Mapping, Annexure D: Data Visualisation, Annexure E: Project Consulting).
- **Commercial Terms with ZAR Currency Controls**:
  - Multi-currency dropdown defaulting to South African Rand (`ZAR / R`).
  - Automatic real-time balance calculations (`Project Value - Deposit Amount`).
- **Legal Compliance**:
  - POPIA (Protection of Personal Information Act No. 4 of 2013) compliant data governance clauses.
  - ECTA (Electronic Communications and Transactions Act No. 25 of 2002) digital signature & non-repudiation clauses.
- **Formspree Integration & Audit Trail**:
  - Sends full agreement text, chosen annexure details, canvas signature image (base64 PNG), IP address, and ISO timestamp.

---

## Everyday Git Commands Quick Reference

### 1. Daily Workflow (Save & Push Changes)
```bash
# Check modified files
git status

# Stage all changes
git add .

# Commit changes with a descriptive message
git commit -m "Your update description here"

# Push changes to GitHub (origin main)
git push
```

### 2. Pull Latest Changes from GitHub
```bash
git pull origin main
```

### 3. Check Branches and Status
```bash
# View current branch and remote tracking
git branch -vv

# View recent commit history
git log --oneline -n 5
```

### 4. Discard Local Changes (If Needed)
```bash
# Discard changes in a specific file
git restore filename.html

# Discard all unstaged changes
git restore .
```
