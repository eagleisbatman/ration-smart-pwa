# API Gap Analysis: Backend vs PWA Frontend

**Date:** February 4, 2026
**Backend:** RationSmart FastAPI (OpenAPI at `http://ec2-18-60-203-199.ap-south-2.compute.amazonaws.com:8000/openapi.json`)
**Frontend:** RationSmart Quasar PWA

---

## Executive Summary

There are significant misalignments between the backend API and the PWA frontend:

1. **Endpoint path mismatches**: PWA uses `/api/v1/*` paths; backend uses direct paths like `/auth/*`, `/feeds/*`
2. **Missing backend endpoints**: PWA expects endpoints for cows, milk logs, diet history that don't exist in backend
3. **Missing PWA features**: Backend has simulations, user feedback, feed classification that PWA doesn't implement
4. **Schema differences**: Request/response formats likely differ

---

## 1. Authentication (`/auth/*` vs `/api/v1/users/*`)

### Backend Endpoints (Available)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/register` | POST | Register new user |
| `/auth/login` | POST | User login |
| `/auth/countries` | GET | Get available countries |
| `/auth/user/{email_id}` | GET | Get user by email |
| `/auth/forgot-pin` | POST | Forgot PIN |
| `/auth/change-pin` | POST | Change PIN |
| `/auth/user-delete-account` | POST | Delete user account |

### PWA Implementation
| PWA Endpoint | Method | Maps to Backend | Status |
|--------------|--------|-----------------|--------|
| `/api/v1/users/register` | POST | `/auth/register` | **PATH MISMATCH** |
| `/api/v1/users/login` | POST | `/auth/login` | **PATH MISMATCH** |
| `/api/v1/users/verify-pin` | POST | ❌ None | **MISSING IN BACKEND** |
| `/api/v1/users/{userId}` | GET | `/auth/user/{email_id}` | **PATH MISMATCH** (also different param name) |
| `/api/v1/users/{userId}` | PUT | ❌ None | **MISSING IN BACKEND** |
| `/api/v1/users/change-pin` | POST | `/auth/change-pin` | **PATH MISMATCH** |

### Not Implemented in PWA
- ❌ Countries list (`/auth/countries`)
- ❌ Forgot PIN (`/auth/forgot-pin`)
- ❌ Delete account (`/auth/user-delete-account`)

---

## 2. Feeds (`/feeds/*` vs `/api/v1/feeds/*`)

### Backend Endpoints (Available)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/feeds/` | GET | Get feeds with country filter |
| `/feeds/{feed_id}` | GET | Get single feed |
| `/feeds/create-new-feed/` | POST | Create custom feed |
| `/feeds/update-feed/{feed_id}` | PUT | Update feed |
| `/feeds/delete-feed/{feed_id}` | DELETE | Delete feed |
| `/unique-feed-type/{country_id}/{user_id}` | GET | Get unique feed types |
| `/unique-feed-category` | GET | Get unique categories |
| `/feed-name` | GET | Get feed names |
| `/feed-details/{user_id}/{feed_id}` | GET | Get feed details |
| `/insert-custom-feed/` | POST | Insert custom feed |
| `/update-custom-feed/` | PUT | Update custom feed |
| `/check-insert-or-update/` | GET | Check feed operation |

### Feed Classification Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/feed-classification/get-feed-types` | GET | Get all feed types |
| `/feed-classification/types/{type_id}` | GET | Get specific type |
| `/feed-classification/get-categories/{type_id}` | GET | Get categories by type |
| `/feed-classification/structure` | GET | Get full classification structure |

### PWA Implementation
| PWA Endpoint | Method | Maps to Backend | Status |
|--------------|--------|-----------------|--------|
| `/api/v1/feeds/master` | GET | `/feeds/` | **PATH MISMATCH** |
| `/api/v1/feeds/custom` | GET | ❌ None directly | **NEEDS MAPPING** |
| `/api/v1/feeds/{id}` | GET | `/feed-details/{user_id}/{feed_id}` | **PATH MISMATCH** (needs user_id) |
| `/api/v1/feeds/custom` | POST | `/insert-custom-feed/` | **PATH MISMATCH** |
| `/api/v1/feeds/custom/{id}` | PUT | `/update-custom-feed/` | **PATH MISMATCH** |
| `/api/v1/feeds/custom/{id}` | DELETE | `/feeds/delete-feed/{feed_id}` | **PATH MISMATCH** |

### Not Implemented in PWA
- ❌ Feed types lookup (`/unique-feed-type/`)
- ❌ Categories lookup (`/unique-feed-category`)
- ❌ Feed name lookup (`/feed-name`)
- ❌ Check insert/update (`/check-insert-or-update/`)
- ❌ Feed classification system (entire feature)

---

## 3. Diet Optimization (`/diet-*` vs `/api/v1/diet/*`)

### Backend Endpoints (Available)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/diet-recommendation-working/` | POST | Get diet recommendation |
| `/diet-evaluation-working/` | POST | Evaluate diet |

### PWA Implementation
| PWA Endpoint | Method | Maps to Backend | Status |
|--------------|--------|-----------------|--------|
| `/api/v1/diet/optimize` | POST | `/diet-recommendation-working/` | **PATH MISMATCH** |
| `/api/v1/diet/{id}/evaluate` | POST | `/diet-evaluation-working/` | **PATH MISMATCH** |
| `/api/v1/diet/history` | GET | ❌ None | **MISSING IN BACKEND** |
| `/api/v1/diet/{id}` | GET | ❌ None | **MISSING IN BACKEND** |
| `/api/v1/diet/{id}` | DELETE | ❌ None | **MISSING IN BACKEND** |

### Backend Schema (DietRecommendationRequestWorking)
```json
{
  "animal_weight": 400,
  "milk_production": 10,
  "milk_fat": 4.0,
  "stage_of_lactation": "mid",
  "is_pregnant": false,
  "month_of_pregnancy": 0,
  "rumen_fill_percent": 100,
  "cost_preference_level": 2,
  "available_feed_ids": ["feed_id_1", "feed_id_2"],
  "feed_constraints": {
    "feed_id_1": {"min": 0.5, "max": 2.0}
  },
  "country_id": "IN",
  "user_id": "user_123"
}
```

### PWA Schema (DietInput)
```typescript
{
  cow_id?: string;
  cow_name?: string;
  weight_kg: number;
  milk_yield_liters: number;
  milk_fat_percentage: number;
  lactation_stage: string;
  is_pregnant?: boolean;
  pregnancy_month?: number;
  activity_level?: string;
  optimization_goal: 'minimize_cost' | 'maximize_milk' | 'balanced';
  available_feeds: string[];
  feed_constraints?: Record<string, { min?: number; max?: number }>;
  budget_per_day?: number;
}
```

**Field Mapping Needed:**
| PWA Field | Backend Field |
|-----------|---------------|
| `weight_kg` | `animal_weight` |
| `milk_yield_liters` | `milk_production` |
| `milk_fat_percentage` | `milk_fat` |
| `lactation_stage` | `stage_of_lactation` |
| `is_pregnant` | `is_pregnant` ✓ |
| `pregnancy_month` | `month_of_pregnancy` |
| `available_feeds` | `available_feed_ids` |
| `feed_constraints` | `feed_constraints` ✓ |
| `optimization_goal` | `cost_preference_level` (different format) |
| `budget_per_day` | ❌ Not in backend |
| `cow_id`, `cow_name` | ❌ Not in backend |
| ❌ Not in PWA | `rumen_fill_percent` |
| ❌ Not in PWA | `country_id`, `user_id` (in path/header) |

---

## 4. Cow Management - **CRITICAL GAP**

### Backend Endpoints
**❌ NONE - Backend does NOT have cow management endpoints!**

### PWA Implementation (Expects These)
| PWA Endpoint | Method | Status |
|--------------|--------|--------|
| `/api/v1/cows` | GET | **NO BACKEND SUPPORT** |
| `/api/v1/cows` | POST | **NO BACKEND SUPPORT** |
| `/api/v1/cows/{id}` | GET | **NO BACKEND SUPPORT** |
| `/api/v1/cows/{id}` | PUT | **NO BACKEND SUPPORT** |
| `/api/v1/cows/{id}` | DELETE | **NO BACKEND SUPPORT** |

**Resolution Options:**
1. Add cow CRUD endpoints to backend
2. Store cows locally only in PWA (offline-only feature)
3. Use simulations as proxy for cow data

---

## 5. Milk Logs - **CRITICAL GAP**

### Backend Endpoints
**❌ NONE - Backend does NOT have milk logging endpoints!**

### PWA Implementation (Expects These)
| PWA Endpoint | Method | Status |
|--------------|--------|--------|
| `/api/v1/milk-logs` | GET | **NO BACKEND SUPPORT** |
| `/api/v1/milk-logs` | POST | **NO BACKEND SUPPORT** |
| `/api/v1/milk-logs/{id}` | GET | **NO BACKEND SUPPORT** |
| `/api/v1/milk-logs/{id}` | PUT | **NO BACKEND SUPPORT** |
| `/api/v1/milk-logs/{id}` | DELETE | **NO BACKEND SUPPORT** |

**Resolution Options:**
1. Add milk logging endpoints to backend
2. Store milk logs locally only (offline-only)
3. Integrate with simulations feature

---

## 6. Reports (`/pdf-*`, `/generate-*` vs `/api/v1/reports/*`)

### Backend Endpoints (Available)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/generate-pdf-report/` | POST | Generate PDF report |
| `/pdf-reports/{user_id}` | GET | Get user's reports |
| `/pdf-report/{report_id}/{user_id}` | GET | Get specific report |
| `/pdf-report-metadata/{report_id}/{user_id}` | GET | Get report metadata |
| `/generate-report/` | POST | Generate report |
| `/save-report/` | POST | Save report |
| `/get-user-reports/` | GET | Get user reports |

### PWA Implementation
| PWA Endpoint | Method | Maps to Backend | Status |
|--------------|--------|-----------------|--------|
| `/api/v1/reports/generate` | POST | `/generate-pdf-report/` or `/generate-report/` | **PATH MISMATCH** |
| `/api/v1/reports` | GET | `/pdf-reports/{user_id}` or `/get-user-reports/` | **PATH MISMATCH** |
| `/api/v1/reports/{id}` | GET | `/pdf-report/{report_id}/{user_id}` | **PATH MISMATCH** (needs user_id) |

---

## 7. Simulations - **NOT IMPLEMENTED IN PWA**

### Backend Endpoints (Available)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/fetch-all-simulations/` | POST | Get all simulations |
| `/fetch-simulation-details/` | POST | Get simulation details |

### PWA Status
**❌ Entire feature not implemented**

---

## 8. User Feedback - **NOT IMPLEMENTED IN PWA**

### Backend Endpoints (Available)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/user-feedback/submit` | POST | Submit feedback |
| `/user-feedback/my` | GET | Get my feedback |

### PWA Status
**❌ Entire feature not implemented**

---

## 9. Admin Endpoints - **NOT IMPLEMENTED IN PWA**

Backend has extensive admin functionality:
- `/admin/users-count`
- `/admin/users-summary`
- `/admin/users`
- `/admin/all-simulations`
- `/admin/simulation`
- `/admin/feed-prices`
- `/admin/country-prices`
- `/admin/recommendations`
- `/admin/recommendation-feeds`
- And more...

### PWA Status
**❌ No admin interface implemented**

---

## Summary Table

| Feature | Backend | PWA | Gap Type |
|---------|---------|-----|----------|
| Auth | ✅ 7 endpoints | ✅ 6 endpoints | Path mismatch, missing forgot-pin, delete account |
| Feeds | ✅ 12+ endpoints | ✅ 6 endpoints | Path mismatch, missing classification |
| Diet | ✅ 2 endpoints | ✅ 5 endpoints | Path mismatch, PWA expects history/CRUD |
| Cows | ❌ None | ✅ 5 endpoints | **Backend needs these** |
| Milk Logs | ❌ None | ✅ 5 endpoints | **Backend needs these** |
| Reports | ✅ 7 endpoints | ✅ 3 endpoints | Path mismatch |
| Simulations | ✅ 2 endpoints | ❌ None | PWA missing feature |
| User Feedback | ✅ 2 endpoints | ❌ None | PWA missing feature |
| Feed Classification | ✅ 4 endpoints | ❌ None | PWA missing feature |
| Admin | ✅ 15+ endpoints | ❌ None | PWA missing feature |

---

## Recommended Actions

### High Priority (Blocking)

1. **Create API adapter layer** in PWA to map `/api/v1/*` paths to actual backend paths
2. **Add cow CRUD endpoints** to backend OR make cows offline-only
3. **Add milk logging endpoints** to backend OR make logs offline-only
4. **Add diet history/CRUD endpoints** to backend

### Medium Priority

5. **Implement forgot PIN** flow in PWA
6. **Implement delete account** flow in PWA
7. **Add feed classification** browser/picker in PWA
8. **Align request/response schemas** between PWA and backend

### Low Priority

9. Add simulations feature to PWA
10. Add user feedback feature to PWA
11. Build admin dashboard (separate project?)

---

## Suggested API Adapter Implementation

Create `src/services/api-adapter.ts`:

```typescript
// Map PWA endpoints to backend endpoints
const endpointMap: Record<string, string> = {
  // Auth
  '/api/v1/users/register': '/auth/register',
  '/api/v1/users/login': '/auth/login',
  '/api/v1/users/change-pin': '/auth/change-pin',

  // Feeds
  '/api/v1/feeds/master': '/feeds/',
  '/api/v1/feeds/custom': '/insert-custom-feed/',

  // Diet
  '/api/v1/diet/optimize': '/diet-recommendation-working/',

  // Reports
  '/api/v1/reports/generate': '/generate-pdf-report/',
};

// Request body transformers
const requestTransformers = {
  '/api/v1/diet/optimize': (data: DietInput) => ({
    animal_weight: data.weight_kg,
    milk_production: data.milk_yield_liters,
    milk_fat: data.milk_fat_percentage,
    stage_of_lactation: data.lactation_stage,
    is_pregnant: data.is_pregnant ?? false,
    month_of_pregnancy: data.pregnancy_month ?? 0,
    rumen_fill_percent: 100,
    cost_preference_level: mapGoalToLevel(data.optimization_goal),
    available_feed_ids: data.available_feeds,
    feed_constraints: data.feed_constraints ?? {},
  }),
};
```

---

## Files Referenced

- Backend: OpenAPI spec at `http://ec2-18-60-203-199.ap-south-2.compute.amazonaws.com:8000/openapi.json`
- `src/stores/auth.ts`
- `src/stores/feeds.ts`
- `src/stores/diets.ts`
- `src/stores/cows.ts`
- `src/stores/milkLogs.ts`
- `src/pages/reports/ReportListPage.vue`
- `src/pages/reports/ReportDetailPage.vue`
