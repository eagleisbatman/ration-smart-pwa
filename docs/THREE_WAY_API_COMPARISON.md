# Three-Way API Comparison

**Date:** February 4, 2026

## Systems Compared

| System | Description | Location |
|--------|-------------|----------|
| **OpenAPI Backend** | Legacy generation-smart-backend | EC2 at `ec2-18-60-203-199.ap-south-2.compute.amazonaws.com:8000` |
| **RationSmart Backend** | New ration-smart-backend | Railway (PostgreSQL) at `/ration-smart-backend` |
| **PWA Frontend** | Quasar Vue 3 PWA | `/ration-smart-pwa` |

---

## System Architecture Overview

### RationSmart Backend (Railway) - Target Personas

Based on the router structure, this backend serves **THREE distinct user personas**:

| Persona | Prefix | Description |
|---------|--------|-------------|
| **App Users** | `/auth/*`, root endpoints | Mobile/PWA app users (email + PIN auth) |
| **Telegram Bot Users** | `/telegram-users/*`, `/bot-*`, `/cow-profiles/*` | Telegram bot users |
| **Admins** | `/admin/*` | Administrative functions |

### Database Tables (RationSmart Backend)

```
Users & Auth:
├── CountryModel
├── BreedModel
└── UserInformationModel

Feeds:
├── Feed (legacy)
├── CustomFeed
├── MasterFeed
├── FeedCountryAvailability
├── FeedCountryPricing
├── FeedAnalytics
├── FeedType
└── FeedCategory

Reports:
├── DietReport
└── Report

Telegram Bot Data:
├── CowProfileModel
├── TelegramUserModel
├── BotDietHistoryModel
├── BotDailyLogModel
├── BotFollowUpLogModel
└── BotEventModel

App Data:
├── AppEventModel
├── AppDeviceTokenModel
├── UserFeedback
└── SystemMetadata
```

---

## Detailed Endpoint Comparison

### 1. Authentication

| Endpoint | OpenAPI (EC2) | RationSmart Backend | PWA Frontend | Notes |
|----------|---------------|---------------------|--------------|-------|
| Register (email) | `/auth/register` | `/auth/register` | `/api/v1/users/register` | PWA path mismatch |
| Register (phone) | - | `/auth/register-phone` | - | New in RSB |
| Login (email) | `/auth/login` | `/auth/login` | `/api/v1/users/login` | PWA path mismatch |
| Login (phone) | - | `/auth/login-phone` | - | New in RSB |
| Get countries | `/auth/countries` | `/auth/countries` | - | Not in PWA |
| Get user by email | `/auth/user/{email_id}` | `/auth/user/{email_id}` | `/api/v1/users/{userId}` | PWA uses userId, backend uses email_id |
| Get user by ID | - | `/auth/user/id/{user_id}` | - | New in RSB |
| Update user | - | `/auth/user/{email_id}` (PUT) | `/api/v1/users/{userId}` (PUT) | Different param |
| Update user by ID | - | `/auth/user/id/{user_id}` (PUT) | - | New in RSB |
| Forgot PIN | `/auth/forgot-pin` | `/auth/forgot-pin` | - | Not in PWA |
| Change PIN | `/auth/change-pin` | `/auth/change-pin` | `/api/v1/users/change-pin` | PWA path mismatch |
| Delete account | `/auth/user-delete-account` | `/auth/user-delete-account` | - | Not in PWA |
| Verify PIN | - | - | `/api/v1/users/verify-pin` | Only in PWA |
| Get breeds | - | `/auth/breeds/{country_id}` | - | New in RSB |

**Verdict:** RationSmart Backend has MORE auth features than OpenAPI spec. PWA needs path alignment.

---

### 2. Feeds Management

| Endpoint | OpenAPI (EC2) | RationSmart Backend | PWA Frontend | Notes |
|----------|---------------|---------------------|--------------|-------|
| Get feeds list | `/feeds/` | `/feeds/` | `/api/v1/feeds/master` | All different paths |
| Get master feeds | - | `/master-feeds/` | `/api/v1/feeds/master` | RSB has dedicated endpoint |
| Get single feed | `/feeds/{feed_id}` | `/feeds/{feed_id}` | `/api/v1/feeds/{id}` | PWA path mismatch |
| Get feed details | `/feed-details/{user_id}/{feed_id}` | `/feed-details/{user_id}/{feed_id}` | - | PWA uses simpler path |
| Create custom feed | `/insert-custom-feed/` | `/insert-custom-feed/` | `/api/v1/feeds/custom` (POST) | PWA different path |
| Update custom feed | `/update-custom-feed/` | `/update-custom-feed/` | `/api/v1/feeds/custom/{id}` (PUT) | PWA different path |
| Delete feed | `/feeds/delete-feed/{feed_id}` | `/feeds/delete-feed/{feed_id}` | `/api/v1/feeds/custom/{id}` (DELETE) | PWA different path |
| Get custom feeds | - | - | `/api/v1/feeds/custom` (GET) | Only in PWA |
| Feed types | `/unique-feed-type/{country_id}/{user_id}` | `/unique-feed-type/{country_id}/{user_id}` | - | Not in PWA |
| Feed categories | `/unique-feed-category` | `/unique-feed-category` | - | Not in PWA |
| Feed names | `/feed-name` | `/feed-name` | - | Not in PWA |
| Check insert/update | `/check-insert-or-update/` | `/check-insert-or-update/` | - | Not in PWA |
| Feed analytics | - | `/feed-analytics/` | - | Only in RSB |

---

### 3. Feed Classification

| Endpoint | OpenAPI (EC2) | RationSmart Backend | PWA Frontend | Notes |
|----------|---------------|---------------------|--------------|-------|
| Get feed types | `/feed-classification/get-feed-types` | Not included* | - | Router exists but not mounted |
| Get type by ID | `/feed-classification/types/{type_id}` | Not included* | - | Router exists but not mounted |
| Get categories | `/feed-classification/get-categories/{type_id}` | Not included* | - | Router exists but not mounted |
| Get structure | `/feed-classification/structure` | Not included* | - | Router exists but not mounted |

*Note: `feed_classification.py` exists in RSB but is NOT included in `main.py`

---

### 4. Diet Recommendation & Evaluation

| Endpoint | OpenAPI (EC2) | RationSmart Backend | PWA Frontend | Notes |
|----------|---------------|---------------------|--------------|-------|
| Diet recommendation | `/diet-recommendation-working/` | `/diet-recommendation-working/` | `/api/v1/diet/optimize` | PWA different path |
| Diet evaluation | `/diet-evaluation-working/` | `/diet-evaluation-working/` | `/api/v1/diet/{id}/evaluate` | PWA different path + format |
| Diet history | - | - | `/api/v1/diet/history` | Only in PWA |
| Get diet by ID | - | - | `/api/v1/diet/{id}` | Only in PWA |
| Delete diet | - | - | `/api/v1/diet/{id}` (DELETE) | Only in PWA |

**Schema Differences:**

| Field | OpenAPI/RSB | PWA |
|-------|-------------|-----|
| Animal weight | `animal_weight` | `weight_kg` |
| Milk production | `milk_production` | `milk_yield_liters` |
| Milk fat | `milk_fat` | `milk_fat_percentage` |
| Lactation stage | `stage_of_lactation` | `lactation_stage` |
| Pregnancy month | `month_of_pregnancy` | `pregnancy_month` |
| Cost preference | `cost_preference_level` (1-5) | `optimization_goal` (enum) |
| Rumen fill | `rumen_fill_percent` | - |
| Cow reference | - | `cow_id`, `cow_name` |
| Budget | - | `budget_per_day` |

---

### 5. Reports

| Endpoint | OpenAPI (EC2) | RationSmart Backend | PWA Frontend | Notes |
|----------|---------------|---------------------|--------------|-------|
| Generate PDF report | `/generate-pdf-report/` | `/generate-pdf-report/` | `/api/v1/reports/generate` | PWA different path |
| Generate report | `/generate-report/` | `/generate-report/` | - | Not in PWA |
| Get user reports | `/pdf-reports/{user_id}` | `/pdf-reports/{user_id}` | `/api/v1/reports` | PWA different path |
| Get report | `/pdf-report/{report_id}/{user_id}` | `/pdf-report/{report_id}/{user_id}` | `/api/v1/reports/{id}` | PWA missing user_id |
| Get report metadata | `/pdf-report-metadata/{report_id}/{user_id}` | `/pdf-report-metadata/{report_id}/{user_id}` | - | Not in PWA |
| Delete report | - | `/pdf-report/{report_id}/{user_id}` (DELETE) | - | New in RSB |
| Save report | `/save-report/` | `/save-report/` | - | Not in PWA |
| Get all user reports | `/get-user-reports/` | `/get-user-reports/` | - | Not in PWA |

---

### 6. Simulations

| Endpoint | OpenAPI (EC2) | RationSmart Backend | PWA Frontend | Notes |
|----------|---------------|---------------------|--------------|-------|
| Fetch all simulations | `/fetch-all-simulations/` | `/fetch-all-simulations/` | - | Not in PWA |
| Fetch simulation details | `/fetch-simulation-details/` | `/fetch-simulation-details/` | - | Not in PWA |

**Verdict:** Entire simulations feature NOT implemented in PWA.

---

### 7. User Feedback

| Endpoint | OpenAPI (EC2) | RationSmart Backend | PWA Frontend | Notes |
|----------|---------------|---------------------|--------------|-------|
| Submit feedback | `/user-feedback/submit` | Not included* | - | Router not mounted |
| Get my feedback | `/user-feedback/my` | Not included* | - | Router not mounted |

*Note: `user_feedback.py` exists but is NOT included in `main.py`

---

### 8. Cow Profiles (NEW in RationSmart Backend)

| Endpoint | OpenAPI (EC2) | RationSmart Backend | PWA Frontend | Notes |
|----------|---------------|---------------------|--------------|-------|
| Create cow profile | - | `/cow-profiles/` (POST) | `/api/v1/cows` (POST) | Different paths |
| Get user's cows | - | `/cow-profiles/user/{telegram_user_id}` | `/api/v1/cows` | RSB uses telegram_user_id |
| Get cow details | - | `/cow-profiles/detail/{cow_id}` | `/api/v1/cows/{id}` | Different paths |
| Update cow | - | `/cow-profiles/{cow_id}` (PUT) | `/api/v1/cows/{id}` (PUT) | Similar |
| Delete cow | - | `/cow-profiles/{cow_id}` (DELETE) | `/api/v1/cows/{id}` (DELETE) | Similar |

**Key Insight:** RationSmart Backend HAS cow profile endpoints! But they're under `/cow-profiles/` and designed for **Telegram users** (using `telegram_user_id`).

---

### 9. Daily Milk Logs (NEW in RationSmart Backend)

| Endpoint | OpenAPI (EC2) | RationSmart Backend | PWA Frontend | Notes |
|----------|---------------|---------------------|--------------|-------|
| Create log | - | `/bot-daily-logs/` (POST) | `/api/v1/milk-logs` (POST) | Different paths |
| Get user logs | - | `/bot-daily-logs/user/{telegram_user_id}` | `/api/v1/milk-logs` | RSB uses telegram_user_id |
| Get cow logs | - | `/bot-daily-logs/cow/{cow_profile_id}` | `/api/v1/milk-logs?cow_id=X` | Different approaches |
| Get log by date | - | `/bot-daily-logs/by-date/{cow_profile_id}/{log_date}` | - | Only in RSB |
| Get pending logs | - | `/bot-daily-logs/pending/{telegram_user_id}` | - | Only in RSB |
| Get single log | - | `/bot-daily-logs/{log_id}` | `/api/v1/milk-logs/{id}` | Similar |
| Update log | - | `/bot-daily-logs/{log_id}` (PUT) | `/api/v1/milk-logs/{id}` (PUT) | Similar |
| Update by date | - | `/bot-daily-logs/by-date/{cow_id}/{date}` (PUT) | - | Only in RSB |
| Delete log | - | `/bot-daily-logs/{log_id}` (DELETE) | `/api/v1/milk-logs/{id}` (DELETE) | Similar |

**Key Insight:** RationSmart Backend HAS milk logging endpoints! Under `/bot-daily-logs/` for **Telegram users**.

---

### 10. Diet History (NEW in RationSmart Backend)

| Endpoint | OpenAPI (EC2) | RationSmart Backend | PWA Frontend | Notes |
|----------|---------------|---------------------|--------------|-------|
| Create diet record | - | `/bot-diet-history/` (POST) | - | Only in RSB |
| Get user diets | - | `/bot-diet-history/user/{telegram_user_id}` | `/api/v1/diet/history` | Different paths |
| Get cow diets | - | `/bot-diet-history/cow/{cow_profile_id}` | - | Only in RSB |
| Get active diet | - | `/bot-diet-history/active/{cow_profile_id}` | - | Only in RSB |
| Get diet | - | `/bot-diet-history/{diet_id}` | `/api/v1/diet/{id}` | Similar |
| Update diet | - | `/bot-diet-history/{diet_id}` (PUT) | - | Only in RSB |
| Delete diet | - | `/bot-diet-history/{diet_id}` (DELETE) | `/api/v1/diet/{id}` (DELETE) | Similar |
| Archive diet | - | `/bot-diet-history/{diet_id}/archive` (POST) | - | Only in RSB |

---

### 11. Telegram-Only Features (RationSmart Backend)

These endpoints are specifically for Telegram bot integration:

| Router | Endpoints |
|--------|-----------|
| `/telegram-users/*` | User registration for Telegram |
| `/bot-follow-up-logs/*` | Weekly check-in reminders |
| `/bot-events/*` | Bot analytics (not mounted) |

---

### 12. App Features (RationSmart Backend)

| Endpoint | RationSmart Backend | PWA Frontend | Notes |
|----------|---------------------|--------------|-------|
| Register device token | `/app/device-tokens` (POST) | - | Push notifications |
| Delete device token | `/app/device-tokens/{token}` (DELETE) | - | |
| Send notification | `/app/notifications/send` (POST) | - | |
| Log events | `/events` (POST) | - | Analytics |
| Bulk log events | `/events/bulk` (POST) | - | |
| Get events | `/analytics/events` (GET) | - | |
| Location onboarding | `/onboarding/location` (POST) | - | |

---

## Summary: What PWA Needs to Support

### Critical Path Mappings Required

```typescript
// API Adapter mappings for PWA
const pathMappings = {
  // Auth
  '/api/v1/users/register': '/auth/register',
  '/api/v1/users/login': '/auth/login',
  '/api/v1/users/{userId}': '/auth/user/id/{user_id}',  // Use ID endpoint
  '/api/v1/users/change-pin': '/auth/change-pin',

  // Feeds
  '/api/v1/feeds/master': '/master-feeds/',
  '/api/v1/feeds/custom': '/insert-custom-feed/',
  '/api/v1/feeds/{id}': '/feeds/{feed_id}',

  // Diet
  '/api/v1/diet/optimize': '/diet-recommendation-working/',
  '/api/v1/diet/history': '/bot-diet-history/user/{user_id}',  // Need to adapt for app users
  '/api/v1/diet/{id}': '/bot-diet-history/{diet_id}',
  '/api/v1/diet/{id}/evaluate': '/diet-evaluation-working/',

  // Cows - Need app user endpoints OR use cow-profiles
  '/api/v1/cows': '/cow-profiles/',  // BUT needs app user support
  '/api/v1/cows/{id}': '/cow-profiles/detail/{cow_id}',

  // Milk Logs - Need app user endpoints OR use bot-daily-logs
  '/api/v1/milk-logs': '/bot-daily-logs/',  // BUT needs app user support
  '/api/v1/milk-logs/{id}': '/bot-daily-logs/{log_id}',

  // Reports
  '/api/v1/reports/generate': '/generate-pdf-report/',
  '/api/v1/reports': '/pdf-reports/{user_id}',
  '/api/v1/reports/{id}': '/pdf-report/{report_id}/{user_id}',
};
```

### Backend Changes Needed

1. **User Type Support**: Currently cow-profiles, bot-daily-logs use `telegram_user_id`. Need to support regular app `user_id` as well.

2. **Missing Routers to Mount**:
   - `user_feedback_router` (exists but not mounted)
   - `feed_classification_router` (exists but not mounted)

3. **Verify PIN Endpoint**: PWA expects `/api/v1/users/verify-pin` - needs to be added OR removed from PWA.

### PWA Changes Needed

1. **Create API Adapter Layer** to transform:
   - Endpoint paths
   - Request body field names
   - Response formats

2. **Add Missing Features**:
   - Countries selection on registration
   - Forgot PIN flow
   - Delete account
   - Feed classification browser
   - Simulations viewer

3. **Remove/Adjust**:
   - Verify PIN endpoint (doesn't exist in backend)
   - Custom reports list endpoint

---

## Persona Flow Comparison

### Telegram Bot User Flow (Currently Supported)
```
Register via /telegram-users → Get cow-profile → Get diet → Log daily → Get follow-up reminders
                                      ↓
                               Uses telegram_user_id throughout
```

### App User Flow (PWA - Needs Work)
```
Register via /auth/register → Create cow → Get diet → Log milk → View reports
                                   ↓
                            Currently uses /api/v1/* paths
                            Backend has /cow-profiles/* but for telegram users
```

### Required: Add App User Support to Bot Endpoints

Option A: Modify existing endpoints to accept either `telegram_user_id` OR `app_user_id`
Option B: Create parallel endpoints for app users
Option C: Use a unified `user_id` that works for both

---

## Recommended Action Plan

### Phase 1: Immediate (Backend)
1. Add `user_feedback_router` to `main.py`
2. Add `feed_classification_router` to `main.py`
3. Modify cow-profiles/bot-daily-logs to support app `user_id`

### Phase 2: PWA Adaptation
1. Create `src/services/api-adapter.ts` with path mappings
2. Create request/response transformers for diet endpoints
3. Update all stores to use adapter

### Phase 3: Feature Parity
1. Add countries to registration flow
2. Add forgot PIN flow
3. Add simulations viewer
4. Add feed classification picker

---

## Files Referenced

**RationSmart Backend:**
- `app/main.py` - Router mounting
- `app/models.py` - Database models
- `routers/auth.py` - Authentication
- `routers/animal.py` - Diet, feeds, reports, simulations
- `routers/feeds.py` - Master feeds
- `routers/cow_profiles.py` - Cow management
- `routers/bot_daily_logs.py` - Milk logging
- `routers/bot_diet_history.py` - Diet history
- `.env` - Railway PostgreSQL connection

**PWA Frontend:**
- `src/stores/auth.ts`
- `src/stores/feeds.ts`
- `src/stores/diets.ts`
- `src/stores/cows.ts`
- `src/stores/milkLogs.ts`
- `src/pages/reports/ReportListPage.vue`
