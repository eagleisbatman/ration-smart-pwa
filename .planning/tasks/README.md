# RationSmart PWA - Task Tracking

## Overview

This directory contains JSON task files extracted from the comprehensive module review. Each task is actionable with specific file paths, changes, acceptance criteria, and test scenarios.

## Task Files

| File | Modules | Tasks |
|------|---------|-------|
| `modules-1-4-tasks.json` | 1-Auth, 2-Onboarding, 3-Dashboard, 4-Cow Mgmt | 54 |
| `modules-5-8-tasks.json` | 5-Diet, 6-Milk Log, 7-Feed Mgmt, 8-Farmer Mgmt | 32 |
| `modules-9-11-tasks.json` | 9-Yield, 10-Reports, 11-Settings | 24 |
| `module-12-offline-sync.json` | 12-Offline & Sync | 8 |
| **Total** | **12 modules** | **118 tasks** |

## Priority Summary

| Priority | Count | Description |
|----------|-------|-------------|
| **Critical** | 6 | Blocking issues - app may crash or fail |
| **High** | 28 | Functionality gaps - features broken for some users |
| **Medium** | 60 | UX/Polish - app works but experience is degraded |
| **Low** | 24 | Nice-to-have - enhancements for future |

## Task Status Values

- `pending` - Not started
- `in_progress` - Currently being worked on
- `completed` - Done and verified
- `blocked` - Waiting on dependency
- `skipped` - Intentionally not doing

## Common Task Categories

### 1. Internationalization (i18n)
**Tasks:** H13, H15, H16, H18, H19, H21, H23, H25, H27
**Pattern:** Replace hardcoded English with `$t('key')` calls
**Files:** All page/component `.vue` files + `src/i18n/*.json`

### 2. Currency Localization
**Tasks:** H14, H17
**Pattern:** Replace hardcoded ₹ with dynamic currency based on user's country
**Solution:** Create `useCurrency.ts` composable

### 3. Date Localization
**Tasks:** H20, H22, M50
**Pattern:** Replace hardcoded 'en-US' date formats with locale-aware formatting
**Solution:** Create `useDateFormat.ts` composable using date-fns locales

### 4. Icon Consistency (Cow Icon)
**Tasks:** H24, M22, M33, M44, M45, M46
**Pattern:** Replace generic 'pets' icon with cow-specific icon
**Solution:** Create `src/assets/icons/cow.svg` custom icon

### 5. API/Backend Alignment
**Tasks:** C1, C2, C5, H2, H6, H8, H12, H26, H28
**Pattern:** Frontend sends data in wrong format or to wrong endpoint
**Solution:** Align with backend API documentation

### 6. Database Migrations
**Tasks:** C3, H3, M54
**Pattern:** Missing columns or tables in PostgreSQL
**Solution:** Create Alembic migrations

## Recommended Implementation Order

### Phase 1: Critical Fixes (6 tasks)
```
C1 → C2 → C3 → C4 → C5 → C6
```
These are blocking issues that prevent basic functionality.

### Phase 2: i18n Foundation (1 task)
Before fixing individual modules, set up i18n infrastructure:
- Verify all locale files exist
- Create translation key structure
- Set up fallback behavior

### Phase 3: High Priority by Module (28 tasks)
Work module-by-module to fix all High priority issues:
```
Module 1: H1, H2, H3, H4
Module 2: H5, H6, H7, H8
Module 3: H9, H10, H11
Module 4: H12, H13
Module 5: H14, H15
... etc
```

### Phase 4: Medium Priority (60 tasks)
Polish and UX improvements after core functionality is solid.

### Phase 5: Low Priority (24 tasks)
Nice-to-have features when time permits.

## JSON Task Schema

```json
{
  "module": "1-auth",
  "taskId": "H1",
  "priority": "high",
  "title": "Short descriptive title",
  "description": "Detailed problem description",
  "files": ["src/path/to/file.vue"],
  "changes": [
    {
      "file": "src/path/to/file.vue",
      "action": "modify",
      "details": "Specific change instructions"
    }
  ],
  "acceptanceCriteria": [
    "Measurable criterion 1",
    "Measurable criterion 2"
  ],
  "testScenarios": [
    {
      "scenario": "Test name",
      "steps": ["Step 1", "Step 2"],
      "expectedResult": "What should happen"
    }
  ],
  "status": "pending",
  "estimatedEffort": "small|medium|large",
  "dependencies": ["C1", "H2"]
}
```

## Usage During Implementation

1. **Pick a task** from the JSON files based on priority
2. **Update status** to `in_progress`
3. **Read the changes** array for specific instructions
4. **Implement** the changes in listed files
5. **Verify** against acceptance criteria
6. **Test** using provided test scenarios
7. **Update status** to `completed`

## Quick Stats Script

To count task statuses, you can use:
```bash
# Count pending tasks
grep -c '"status": "pending"' .planning/tasks/*.json

# Count completed tasks
grep -c '"status": "completed"' .planning/tasks/*.json
```
