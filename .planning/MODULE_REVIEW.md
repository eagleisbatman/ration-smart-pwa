# RationSmart Module-Wise Review

## Overview

This document tracks a comprehensive review of all RationSmart modules across:
- **Database** (PostgreSQL migrations)
- **Backend** (FastAPI routes, models)
- **Frontend** (Vue/Quasar PWA - stores, pages, components)
- **UI/UX** (Design, aesthetics, iconography, typography)

---

## Modules

| # | Module | Status | Gaps Found |
|---|--------|--------|------------|
| 1 | Authentication & User Management | ✅ Reviewed | 15 gaps |
| 2 | Onboarding & Profile Setup | ✅ Reviewed | 18 gaps |
| 3 | Home Dashboard | ✅ Reviewed | 14 gaps |
| 4 | Cow Management | ✅ Reviewed | 11 gaps |
| 5 | Diet Optimization | ✅ Reviewed | 10 gaps |
| 6 | Milk Logging | ✅ Reviewed | 8 gaps |
| 7 | Feed Management | ✅ Reviewed | 8 gaps |
| 8 | Farmer Management (Extension Workers) | ✅ Reviewed | 8 gaps |
| 9 | Yield History | ✅ Reviewed | 8 gaps |
| 10 | Reports | ✅ Reviewed | 8 gaps |
| 11 | Settings & Profile | ✅ Reviewed | 8 gaps |
| 12 | Offline & Sync | ✅ Reviewed | 8 gaps |

---

## Accumulated Gaps

### Critical (Blocking)
| ID | Module | Gap | Impact |
|----|--------|-----|--------|
| C1 | Auth | Phone number format mismatch: Frontend sends 10 digits, backend expects E.164 (+91...) | Phone registration will fail |
| C2 | Auth | Registration sends `country_code` string but backend expects `country_id` UUID | Registration may fail |
| C3 | Onboarding | Missing `administrative_level_names` database migration - ORM model exists but no Alembic migration | Admin level labels won't work |
| C4 | Onboarding | LanguageSelectPage uses wrong array indices - comments say Telugu/Kannada/Vietnamese but shows Bengali/Telugu/Marathi | Users select wrong language |
| C5 | Onboarding | OrgSelectPage API path mismatch - uses `/api/v1/organizations` but backend expects `/organizations` | Organization list won't load |
| C6 | Dashboard | ExtensionWorkerDashboard totalMilk computed returns 0 (TODO in code) | Wrong stats displayed |

### High Priority (Functionality)
| ID | Module | Gap | Impact |
|----|--------|-----|--------|
| H1 | Auth | ~~Login page missing "Forgot PIN?" link~~ | ✅ FIXED - ForgotPinPage added with email/phone support, auto-redirect |
| H2 | Auth | ~~Country list hardcoded in frontend, not fetched from API~~ | ✅ FIXED - Countries fetched from API, alpha-3→alpha-2 conversion in adapter |
| H3 | Auth | Database schema may be missing columns: user_role, admin_level, organization_id, location fields | Data model incomplete |
| H4 | Auth | No email/phone verification flow | Account security risk |
| H5 | Onboarding | Role mismatch: Frontend has 'student', backend expects 'extension_worker', 'feed_supplier', 'other' | Role validation may fail |
| H6 | Onboarding | Settings API expects query params but frontend sends body params | Settings won't update |
| H7 | Onboarding | Missing Amharic language in LanguageSelectPage (Ethiopia is focus country) | Ethiopian users can't select native language |
| H8 | Onboarding | OrgSelectPage expects `country.code` but API returns `country.country_code` | Country filtering fails |
| H9 | Dashboard | Cows store filters by user_id only, not farmer_profile_id for extension workers | Wrong cows shown for managed farmers |
| H10 | Dashboard | Recent Activity section in ExtensionWorkerDashboard is placeholder (not implemented) | Missing feature |
| H11 | Dashboard | Routes /logs/new, /diet/new, /cows/new may not exist | ✅ Verified - routes exist |
| H12 | Cow Management | Breed options hardcoded in CowFormPage - should fetch from API by country | Wrong breeds for user's country |
| H13 | Cow Management | All text labels hardcoded English (form labels, buttons, messages) - not i18n | Non-English users cannot use app |
| H14 | Diet | Currency hardcoded as ₹ (Indian Rupee) throughout diet module | Wrong currency for non-Indian users |
| H15 | Diet | All diet module text hardcoded English (wizard steps, labels, messages) | Non-English users cannot use |
| H16 | Milk Logging | All milk logging text hardcoded English (labels, messages, summaries) | Non-English users cannot use |
| H17 | Feed Management | Currency hardcoded as ₹ throughout feed module | Wrong currency for non-Indian users |
| H18 | Feed Management | All feed module text hardcoded English (categories, labels, messages) | Non-English users cannot use |
| H19 | Farmer Management | All farmer module text hardcoded English (labels, filter chips, messages) | Non-English users cannot use |
| H20 | Farmer Management | Date formatting uses hardcoded 'en-US' locale | Wrong date format for non-US users |
| H21 | Yield History | All yield module text hardcoded English (labels, filters, messages) | Non-English users cannot use |
| H22 | Yield History | Date formatting uses hardcoded 'en-US' locale | Wrong date format for non-US users |
| H23 | Reports | All report module text hardcoded English (types, labels, dialogs) | Non-English users cannot use |
| H24 | Reports | Uses generic 'pets' icon for Cow Performance report type | Less intuitive UI |
| H25 | Settings & Profile | ProfilePage has all text hardcoded English (labels, messages, buttons) | Non-English users cannot use |
| H26 | Settings & Profile | Country/language options hardcoded in frontend, not from API | Can't add new countries/languages |
| H27 | Offline & Sync | All offline UI text hardcoded English ("You're offline", "Syncing...", etc.) | Non-English users cannot understand sync status |
| H28 | Offline & Sync | API endpoints in sync-manager may not match actual backend routes | Sync may fail silently |

### Medium Priority (UX/Polish)
| ID | Module | Gap | Impact |
|----|--------|-----|--------|
| M1 | Auth | ~~Login/Register pages lack branding (no logo, app name, tagline)~~ | ✅ FIXED - Logo, app name, and tagline added to Login/Register pages |
| M2 | Auth | ~~No country flags in registration dropdown~~ | ✅ FIXED - SVG flag icons + dial codes in all auth dropdowns (Login, Register, ForgotPin) |
| M3 | Auth | Toggle buttons use grey background, not visually distinct | Confusing state |
| M4 | Auth | Minimal page styling (just 8px padding) | Looks unfinished |
| M5 | Auth | No visual hierarchy - all inputs same prominence | Harder to scan |
| M6 | Auth | Error banner is plain red block | Could be more helpful |
| M7 | Auth | No password strength indicator for PIN | Users may choose weak PINs |
| M8 | Onboarding | No branding/logo on any onboarding page | Inconsistent brand experience |
| M9 | Onboarding | Only 6 languages shown, 22 available - should show country-relevant languages | Overwhelming or missing options |
| M10 | Onboarding | No visual progress indicator bar (just "Step 1 of 4" text) | Users don't see overall progress |
| M11 | Onboarding | Location auto-fetches on mount without asking user first | Privacy intrusive |
| M12 | Onboarding | No skip option for optional fields (phone, location) | Users may feel forced |
| M13 | Onboarding | Onboarding state uses sessionStorage only - lost on browser close | User must restart onboarding |
| M14 | Onboarding | RoleSelectPage defaults to 'farmer' - may not be user's intent | Wrong role selected |
| M15 | Dashboard | No app branding/logo on home dashboard | Brand recognition |
| M16 | Dashboard | Statistics cards are basic - no trends/charts | Limited insight |
| M17 | Dashboard | No error display in FarmerDashboard (errors stored but not shown) | Silent failures |
| M18 | Dashboard | Empty states use grey icons instead of illustrations | Uninspiring design |
| M19 | Dashboard | No onboarding prompts or tips for new users | Poor discoverability |
| M20 | Dashboard | No notification/alerts section | Missing engagement |
| M21 | Dashboard | ExtensionWorkerDashboard farmers list limited to 5, no "load more" | Truncated data |
| M22 | Cow Management | Generic 'pets' icon instead of cow-specific icon throughout module | Less intuitive UI |
| M23 | Cow Management | No cow photo/image upload feature | Can't visually identify cows |
| M24 | Cow Management | Quick stats don't show trends (up/down arrows, comparison to average) | Limited insight |
| M25 | Cow Management | Validation messages not translated (hardcoded English) | Poor non-English UX |
| M26 | Cow Management | No bulk actions in cow list (select multiple, archive, delete) | Tedious for large herds |
| M27 | Cow Management | No color/tag field for cow identification | Common identification method missing |
| M28 | Diet | No share/export diet feature (PDF, WhatsApp, print) | Can't share with others or print |
| M29 | Diet | No "regenerate" option for failed or suboptimal diets | Must restart wizard manually |
| M30 | Diet | DietWizard missing body condition score and age inputs | Less accurate optimization |
| M31 | Diet | No comparison view between multiple diet plans | Can't compare alternatives |
| M32 | Diet | No feed availability/stock status indicator | May suggest unavailable feeds |
| M33 | Milk Logging | Generic 'pets' icon used for cow throughout milk logging | Less intuitive UI |
| M34 | Milk Logging | No duplicate log detection (same cow, same date warning) | May create duplicate entries |
| M35 | Milk Logging | No quick entry mode for logging multiple cows at once | Tedious for large herds |
| M36 | Milk Logging | No milk quality indicators beyond fat % (SNF, temperature) | Limited quality tracking |
| M37 | Feed Management | Category options hardcoded in form - should be i18n translated | Categories not localized |
| M38 | Feed Management | No feed image/photo support | Can't visually identify feeds |
| M39 | Feed Management | No stock/inventory tracking for custom feeds | Can't indicate availability |
| M40 | Feed Management | No seasonal availability indicator | Missing for seasonal feeds |
| M41 | Farmer Management | Generic 'person' icon instead of farmer-specific icon | Less intuitive UI |
| M42 | Farmer Management | Farming type options hardcoded (Dairy, Mixed, Crop) - not i18n | Options not localized |
| M43 | Farmer Management | No farmer photo/profile picture support | Can't visually identify farmers |
| M44 | Farmer Management | Uses generic 'pets' icon for cattle count in farmer detail | Less intuitive UI |
| M45 | Yield History | Generic 'person' icon for farmer selection in form | Less intuitive UI |
| M46 | Yield History | Generic 'pets' icon for cow selection in form | Less intuitive UI |
| M47 | Yield History | No visualization/charts of yield trends over time | Limited data insight |
| M48 | Yield History | No edit functionality for yield records (only create) | Can't correct mistakes |
| M49 | Reports | No offline support for report generation (online only) | Can't generate offline |
| M50 | Reports | Report date format uses hardcoded 'en-US' style | Not localized |
| M51 | Reports | No report scheduling or recurring reports feature | Manual regeneration |
| M52 | Reports | Report preview is placeholder - no actual PDF preview | Must download to view |
| M53 | Settings & Profile | Generic 'person' icon for user avatar | Less personal UI |
| M54 | Settings & Profile | No profile photo/avatar upload support | Can't personalize profile |
| M55 | Settings & Profile | Organization type labels hardcoded in formatOrgType() | Types not localized |
| M56 | Settings & Profile | Cannot edit email/phone after registration | Limited profile flexibility |
| M57 | Offline & Sync | No offline fallback page when network and cache both fail | Users see error instead of friendly message |
| M58 | Offline & Sync | No conflict resolution - last write wins without warning user | May lose data in concurrent edit scenarios |
| M59 | Offline & Sync | forcePullFromServer missing farmer and yield entities | Cannot force refresh all data types |
| M60 | Offline & Sync | No sync history/log visible to users | Users can't see what synced or failed |

### Low Priority (Nice to have)
| ID | Module | Gap | Impact |
|----|--------|-----|--------|
| L1 | Auth | No "Remember me" option on login | Minor convenience |
| L2 | Auth | No biometric login option (fingerprint/face) | Future enhancement |
| L3 | Onboarding | No organization type icons (just colored avatars with letters) | Less intuitive |
| L4 | Onboarding | Role cards could be larger with illustrations | Better engagement |
| L5 | Dashboard | Quick action buttons could have animations/micro-interactions | Better UX feel |
| L6 | Dashboard | No weather widget (useful for dairy farming context) | Nice to have |
| L7 | Cow Management | No milk yield trend chart on cow detail page | Better data visualization |
| L8 | Cow Management | No cow health history/events tracking | Complete health record |
| L9 | Diet | No historical diet cost comparison chart | Better decision making |
| L10 | Diet | No diet reminder/notification integration | Missed feeding times |
| L11 | Milk Logging | No milk price tracking for revenue calculation | Can't track income |
| L12 | Milk Logging | No milk trend chart on list page | Limited data visualization |
| L13 | Feed Management | No price history tracking | Can't see price changes over time |
| L14 | Feed Management | No feed comparison view (side by side) | Can't compare nutritional values |
| L15 | Farmer Management | Quick actions go to /yields routes which may not exist | Navigation errors |
| L16 | Farmer Management | No bulk import for multiple farmers (CSV/Excel) | Tedious for onboarding many farmers |
| L17 | Yield History | No comparison view between farmers' yields | Limited analytical capability |
| L18 | Yield History | No export functionality for yield data (CSV/PDF) | Can't share or backup data |
| L19 | Reports | No report sharing functionality (email, WhatsApp) | Limited distribution options |
| L20 | Reports | No custom report templates | Fixed report formats only |
| L21 | Settings & Profile | Help & Support link not implemented (placeholder) | No user support |
| L22 | Settings & Profile | Privacy Policy link not implemented (placeholder) | Legal compliance gap |
| L23 | Offline & Sync | Manifest lang hardcoded "en" - should follow user preference | Incorrect locale in PWA metadata |
| L24 | Offline & Sync | No storage quota warning when IndexedDB approaches limit | Users may lose data unexpectedly |

---

## Module Reviews

---

## Module 1: Authentication & User Management

**Review Date:** 2026-02-06
**Status:** ✅ Complete
**Gaps Found:** 15 (2 Critical, 4 High, 7 Medium, 2 Low)

### 1.1 Database Schema

**Tables:**
- `country` - Reference data for countries (id, name, country_code, currency, is_active)
- `user_information` - Core user table
- `user_feedback` - User feedback/ratings
- `administrative_level_names` - Location level mappings per country

**user_information columns (from migrations):**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| name | VARCHAR(100) | Required |
| email_id | VARCHAR(255) | Unique |
| pin_hash | VARCHAR(255) | PBKDF2 hashed |
| country_id | UUID | FK to country |
| phone_number | VARCHAR(20) | Optional, unique |
| is_admin | BOOLEAN | Deprecated, use admin_level |
| is_active | BOOLEAN | Account status |
| daily_reminder_enabled | BOOLEAN | Notification pref |
| follow_up_reminder_enabled | BOOLEAN | Notification pref |
| created_at | TIMESTAMP | Auto |
| updated_at | TIMESTAMP | Auto |

**⚠️ GAP H3:** Backend model expects additional columns not clearly in migrations:
- `admin_level` (super_admin, country_admin)
- `user_role` (farmer, extension_worker, etc.)
- `language_code`
- `region`
- `location_lat`, `location_lng`
- `organization_id`
- `self_farmer_profile_id`

**Action needed:** Verify if these are in later migrations or need to be added.

---

### 1.2 Backend API

**Endpoints:**
| Method | Path | Purpose |
|--------|------|---------|
| POST | /auth/register | Email registration |
| POST | /auth/register-phone | Phone registration |
| POST | /auth/login | Email login |
| POST | /auth/login-phone | Phone login |
| POST | /auth/forgot-pin | PIN reset via email |
| POST | /auth/change-pin | Change PIN |
| GET | /auth/user/{email_id} | Get user by email |
| GET | /auth/user/id/{user_id} | Get user by ID |
| PUT | /auth/user/{email_id} | Update profile |
| PUT | /auth/users/{user_id}/settings | Update settings |
| POST | /auth/users/{user_id}/self-profile | Create farmer profile |
| GET | /auth/users/{user_id}/self-profile | Get farmer profile |
| GET | /auth/countries | List countries |
| GET | /auth/breeds/{country_id} | Get breeds by country |

**Registration Request:**
```json
{
  "name": "string (required)",
  "email_id": "string (required if email)",
  "phone_number": "string E.164 format (required if phone)",
  "pin": "string 4 digits (required)",
  "country_id": "UUID (required)",
  "user_role": "string (optional)",
  "language_code": "string (optional)"
}
```

**⚠️ GAP C1:** Backend expects phone in E.164 format (`+919876543210`), frontend sends 10 digits only.

**⚠️ GAP C2:** Backend expects `country_id` as UUID, frontend sends `country_code` as string.

---

### 1.3 Frontend Implementation

**Auth Store State:**
- `user` - Full user object
- `token` - JWT bearer token (localStorage)
- `userId` - User UUID (localStorage)
- `userRole` - Role string (localStorage)
- `preferredLanguage` - Language code (localStorage)
- `selfFarmerProfileId` - For onboarding check (localStorage)

**Auth Pages:**
| Page | Route | Fields |
|------|-------|--------|
| LoginPage | /auth/login | email/phone toggle, PIN |
| RegisterPage | /auth/register | name, email/phone toggle, country, PIN, confirm PIN |

**Registration sends:**
```javascript
{
  name: form.name,
  pin: form.pin,
  country_code: form.country_code,  // ⚠️ Should be country_id
  email: form.email,  // OR phone: form.phone (10 digits, no prefix)
}
```

**✅ GAP H2 — FIXED:** Country options are now fetched from `/auth/countries` API via `authStore.fetchCountries()`. The API adapter in `src/services/api-adapter.ts` maps the endpoint and converts backend alpha-3 codes (IND, KEN, BGD) to frontend alpha-2 codes (IN, KE, BD) in the response transform. A `FALLBACK_COUNTRIES` constant is used when the API is unavailable (offline).

---

### 1.4 UI/UX Review

**Current Design:**
```
┌─────────────────────────────────────┐
│  [Email] [Phone]  ← Toggle          │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 📧 Email                     │   │
│  │ [___________________]       │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🔒 PIN                       │   │
│  │ [____] 👁️                    │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │           Login              │   │
│  └─────────────────────────────┘   │
│                                     │
│  Don't have an account? Register    │
└─────────────────────────────────────┘
```

**Issues Identified:**

**⚠️ GAP M1: No Branding**
- No app logo
- No app name header
- No tagline or welcome message
- No visual identity

**⚠️ GAP M2: Country Selection**
- Dropdown has no flags
- Just plain text labels
- Should show: 🇮🇳 India, 🇰🇪 Kenya, etc.

**⚠️ GAP M3: Toggle State**
- Uses `grey-3` for unselected state
- Selected uses `primary` color
- Low contrast between states
- Should be more visually distinct

**⚠️ GAP M4: Page Layout**
- Only `padding: 0 8px`
- No max-width constraint
- No vertical centering
- No background treatment

**⚠️ GAP M5: Visual Hierarchy**
- All inputs have same visual weight
- Primary action (Login) same size as inputs
- No grouping of related fields

**⚠️ GAP M6: Error Handling**
- Plain red banner
- No icon
- No dismiss button
- No specific error guidance

**✅ GAP H1 — FIXED: "Forgot PIN?" added**
- Login page now has "Forgot PIN?" link under PIN field
- ForgotPinPage at `/auth/forgot-pin` supports both email and phone methods
- Phone method includes country selector with flag icons and dial codes
- Shows success banner with 3-second auto-redirect to login

**Design Recommendations:**
1. ✅ Add logo and welcome text at top — DONE (branding added to Login/Register)
2. Use card-based layout with max-width 400px
3. ✅ Add country flags to dropdown — DONE (SVG flag icons + dial codes in all auth dropdowns)
4. Make toggle more prominent with icons
5. ✅ Add "Forgot PIN?" link under PIN field — DONE (with Remember Me checkbox)
6. Style error banner with icon and actionable text
7. Add subtle background pattern or gradient
8. Consider illustration for auth pages

---

### 1.5 Iconography Review

**Current Icons (Material Icons):**
| Element | Icon | Assessment |
|---------|------|------------|
| Email | `email` | ✅ Good |
| Phone | `phone` | ✅ Good |
| PIN | `lock` | ✅ Good |
| Visibility | `visibility`/`visibility_off` | ✅ Good |
| Country | `public` | ⚠️ Could use flag icon |
| Name | `person` | ✅ Good |

**Recommendations:**
- Icons are standard Material Design, appropriate for the app
- Consider using outlined variants for consistency
- Country selector could use a globe with flag overlay

---

### 1.6 Typography Review

**Current State:**
- Uses Quasar defaults
- No custom font configuration found
- Body text appears to be system font

**Recommendations:**
- Define a clear type scale
- Consider using a readable font like Inter or Roboto
- Set explicit font sizes for headings, body, captions
- Ensure adequate line height for form fields

---

### 1.7 API Adapter Analysis

The frontend uses an API adapter that transforms paths:
- `/api/v1/users/register` → `/auth/register`
- `/api/v1/users/login` → `/auth/login`
- `/api/v1/countries` → `/countries`

**⚠️ Need to verify:** Does the adapter transform `country_code` → `country_id`?

---

### 1.8 Actions Required

| Priority | Gap ID | Action |
|----------|--------|--------|
| **Critical** | C1 | ✅ Fix phone format: Add country code prefix to phone number |
| **Critical** | C2 | ✅ Fix country: Either lookup country_id from code or change API |
| **High** | H1 | ✅ Add "Forgot PIN?" link and page |
| **High** | H2 | ✅ Fetch countries from API instead of hardcoding |
| **High** | H3 | Verify database has all required columns |
| **High** | H4 | Design email/phone verification flow |
| **Medium** | M1-M7 | UI redesign of auth pages |
| **Low** | L1-L2 | Future enhancements |

---

---

## Module 2: Onboarding & Profile Setup

**Review Date:** 2026-02-06
**Status:** ✅ Complete
**Gaps Found:** 18 (3 Critical, 4 High, 7 Medium, 2 Low)

### 2.1 Database Schema

**Tables:**
- `farmer_profiles` - Farmer profile data (self or managed)
- `organizations` - Organizations that manage farmers
- `administrative_level_names` - Country-specific admin level labels (⚠️ **NOT MIGRATED**)

**farmer_profiles columns:**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| organization_id | UUID | FK to organizations (nullable) |
| managed_by_user_id | UUID | FK to user_information (required) |
| is_self_profile | BOOLEAN | True if user's own profile |
| user_id | UUID | FK to user_information (for self-profile) |
| name | VARCHAR(255) | Required |
| phone | VARCHAR(20) | Optional |
| village | VARCHAR(255) | Legacy location field |
| district | VARCHAR(255) | Legacy location field |
| state | VARCHAR(255) | Legacy location field |
| country_id | UUID | FK to country |
| latitude | DECIMAL(10,8) | GPS coordinate |
| longitude | DECIMAL(11,8) | GPS coordinate |
| level_1 - level_6 | VARCHAR(255) | Multi-country admin levels |
| total_cattle | INTEGER | Default 0 |
| land_acres | DECIMAL(10,2) | Optional |
| farming_type | VARCHAR(50) | dairy, mixed, crop |
| is_active | BOOLEAN | Soft delete |
| created_at | TIMESTAMP | Auto |
| updated_at | TIMESTAMP | Auto |

**organizations columns:**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Required |
| type | VARCHAR(50) | university, ngo, cooperative, government, other |
| country_id | UUID | FK to country |
| description | TEXT | Optional |
| contact_email | VARCHAR(255) | Optional |
| contact_phone | VARCHAR(50) | Optional |
| address | TEXT | Optional |
| is_active | BOOLEAN | Default true |
| created_at | TIMESTAMP | Auto |
| updated_at | TIMESTAMP | Auto |

**⚠️ GAP C3:** The `administrative_level_names` table is defined in the ORM model but has NO Alembic migration. This table is required to map level_1-6 to country-specific labels (e.g., India: State/District/Taluka, Ethiopia: Region/Zone/Woreda).

**Seeded Organizations (10 total):**
- India: NDRI, KVK Network, BAIF, Mother Dairy, Digital Green, Amul
- Vietnam: VNUA, Ho Chi Minh Dairy Coop, Vinamilk
- Kenya: Kenya Dairy Board, Egerton University
- Ethiopia: EIAR

---

### 2.2 Backend API

**Onboarding Endpoints:**
| Method | Path | Purpose |
|--------|------|---------|
| POST | /onboarding/location | Reverse geocode coords → country, region, language |
| PUT | /auth/users/{user_id}/settings | Update role, language, organization (query params) |
| POST | /auth/users/{user_id}/self-profile | Create farmer profile |
| GET | /auth/users/{user_id}/self-profile | Get farmer profile |
| PUT | /auth/users/{user_id}/self-profile | Update farmer profile |
| GET | /organizations | List organizations (with filters) |
| GET | /organizations/{org_id} | Get organization details |

**Settings Update (PUT /auth/users/{user_id}/settings):**
```
Query Parameters:
- user_role: farmer|extension_worker|nutritionist|researcher|feed_supplier|other
- language_code: en|hi|te|kn|vi|mr|am
- organization_id: UUID or 'null' to remove
```

**⚠️ GAP H6:** Frontend sends settings as body params, but backend expects query params.

**Self-Profile Create (POST /auth/users/{user_id}/self-profile):**
```json
{
  "name": "string (required)",
  "phone": "string (optional)",
  "latitude": "float (optional)",
  "longitude": "float (optional)",
  "level_1": "string - Country",
  "level_2": "string - State/Region",
  "level_3": "string - District/Zone",
  "level_4": "string - Taluka/Woreda",
  "level_5": "string - Block/Kebele",
  "level_6": "string - Village/Locality",
  "village": "string - legacy",
  "district": "string - legacy",
  "state": "string - legacy",
  "total_cattle": "integer (default 0)",
  "land_acres": "float (optional)",
  "farming_type": "dairy|mixed|crop (optional)"
}
```

**Location API (POST /onboarding/location):**
```json
Request: { "latitude": float, "longitude": float }
Response: {
  "country_name": "string",
  "country_code": "string",
  "region": "string",
  "language_code": "string (auto-detected)",
  "language_reason": "region_match|default"
}
```

---

### 2.3 Frontend Implementation

**Onboarding Flow (4 steps):**
```
/auth/language → /auth/role → /auth/organization → /auth/profile-setup → /
```

**Pages:**
| Page | Route | Purpose |
|------|-------|---------|
| LanguageSelectPage | /auth/language | Select preferred language |
| RoleSelectPage | /auth/role | Select user role |
| OrgSelectPage | /auth/organization | Select organization (or none) |
| MyProfileSetupPage | /auth/profile-setup | Create self-farmer profile |

**LanguageSelectPage Analysis:**

```javascript
const languages = [
  { ...availableLocales[0], flag: '🇬🇧' }, // English - CORRECT
  { ...availableLocales[1], flag: '🇮🇳' }, // Hindi - CORRECT
  { ...availableLocales[2], flag: '🇮🇳' }, // Comment says Telugu, actually Bengali!
  { ...availableLocales[3], flag: '🇮🇳' }, // Comment says Kannada, actually Telugu!
  { ...availableLocales[4], flag: '🇻🇳' }, // Comment says Vietnamese, actually Marathi!
  { ...availableLocales[5], flag: '🇮🇳' }, // Comment says Marathi, actually Tamil!
];
```

**⚠️ GAP C4:** The availableLocales indices don't match the comments:
- [2] = bn (Bengali), not Telugu
- [3] = te (Telugu), not Kannada
- [4] = mr (Marathi) with 🇻🇳 flag! Should be 🇮🇳
- [5] = ta (Tamil), not Marathi

**⚠️ GAP H7:** Missing Amharic (am) which is needed for Ethiopia - a focus country.

**RoleSelectPage Analysis:**
```javascript
const roles = [
  { value: 'farmer', icon: 'agriculture' },
  { value: 'student', icon: 'school' },        // ⚠️ Backend doesn't have 'student'
  { value: 'nutritionist', icon: 'science' },
  { value: 'extensionWorker', icon: 'groups' }, // Backend uses 'extension_worker'
  { value: 'researcher', icon: 'biotech' },
];
```

**⚠️ GAP H5:** Role value mismatch:
- Frontend: 'student' → Backend: no such role
- Frontend: 'extensionWorker' → Backend: 'extension_worker' (snake_case)
- Missing: 'feed_supplier', 'other'

**OrgSelectPage Analysis:**
```javascript
// Fetches countries to get country_id
const countriesRes = await api.get('/api/v1/countries');
const country = countriesRes.data.find((c: { code: string }) => c.code === countryCode);
```

**⚠️ GAP C5:** API path may not be correct (needs adapter verification).

**⚠️ GAP H8:** Looks for `country.code` but API returns `country.country_code`.

**MyProfileSetupPage Analysis:**
- ✅ Good: Uses geolocation API properly
- ✅ Good: Reverse geocodes with OpenStreetMap Nominatim
- ✅ Good: Maps OSM address to level_1-6 fields
- ✅ Good: Sends both new levels and legacy fields for compatibility
- ⚠️ Issue: Auto-fetches location on mount (M11)
- ⚠️ Issue: Settings sent as body params, not query params (H6)

---

### 2.4 UI/UX Review

**Onboarding Flow Wireframe:**
```
┌─────────────────────────────────┐
│        Choose Language          │
│        Step 1 of 4              │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 🇬🇧  English             ○  │
│  └─────────────────────────┘   │
│  ┌─────────────────────────┐   │
│  │ 🇮🇳  हिन्दी (Hindi)       ◉  │
│  └─────────────────────────┘   │
│  ┌─────────────────────────┐   │
│  │ 🇮🇳  తెలుగు (Telugu)      ○  │
│  └─────────────────────────┘   │
│            ...                  │
│                                 │
│  ┌─────────────────────────┐   │
│  │          Next            │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

**Issues Identified:**

**⚠️ GAP M8: No Branding**
- No app logo on any onboarding page
- No app name visible
- Just "Step X of 4" subtitle
- Should match auth page branding (once added)

**⚠️ GAP M9: Language List Issues**
- Only 6 languages shown out of 22 available
- Should filter by country/region
- Missing important languages for focus countries (Amharic)

**⚠️ GAP M10: No Progress Bar**
- Just text "Step 1 of 4"
- Should have visual progress indicator
- Helps users understand overall flow

**⚠️ GAP M11: Auto Location Fetch**
- Location is fetched automatically on MyProfileSetupPage mount
- Should ask permission first or have explicit button
- May trigger browser permission prompt unexpectedly

**⚠️ GAP M12: No Skip Options**
- Phone number is optional but no indication
- Location is optional but UI doesn't show skip option
- Organization selection has "Not Affiliated" which is good

**⚠️ GAP M13: State Persistence**
- Uses sessionStorage for onboarding state
- If user closes browser, they must restart
- Should use IndexedDB or localStorage

**⚠️ GAP M14: Role Default**
- Defaults to 'farmer' selected
- May not reflect user's actual role
- Should have no default or detect from context

---

### 2.5 Iconography Review

**Current Icons:**
| Element | Icon | Assessment |
|---------|------|------------|
| Language avatar | Flag emoji | ✅ Good (though LanguageSelectPage has bugs) |
| Farmer role | `agriculture` | ✅ Good |
| Student role | `school` | ✅ Good |
| Nutritionist role | `science` | ✅ Good |
| Extension Worker | `groups` | ✅ Good |
| Researcher | `biotech` | ✅ Good |
| Organization avatar | First letter | ⚠️ Could use type icons |
| Location | `my_location` | ✅ Good |
| Location success | `check_circle` | ✅ Good |
| Location refresh | `refresh` | ✅ Good |
| Address | `place` | ✅ Good |

**⚠️ GAP L3:** Organizations use colored avatars with first letter. Could use type-specific icons:
- University: `school` or `account_balance`
- Government: `account_balance` or `gavel`
- NGO: `volunteer_activism`
- Cooperative: `groups`

**⚠️ GAP L4:** Role cards are compact. Could benefit from:
- Larger icons
- Illustrations instead of icons
- More descriptive text

---

### 2.6 Typography Review

**Current State:**
- Headings: `text-h5 text-weight-medium`
- Subtitles: `text-body2 text-grey-7`
- Labels: `text-subtitle1 text-weight-medium`
- Captions: `text-caption text-grey-7`

**Assessment:**
- ✅ Consistent use of Quasar typography classes
- ✅ Good hierarchy (h5 for page title, body2 for step indicator)
- ⚠️ No custom fonts defined
- ⚠️ Could use more visual hierarchy in role cards

---

### 2.7 Actions Required

| Priority | Gap ID | Action |
|----------|--------|--------|
| **Critical** | C3 | Create Alembic migration for `administrative_level_names` table |
| **Critical** | C4 | Fix LanguageSelectPage indices to match availableLocales properly |
| **Critical** | C5 | Verify API adapter paths for /organizations endpoint |
| **High** | H5 | Fix role values: 'student'→remove, 'extensionWorker'→'extension_worker' |
| **High** | H6 | Fix settings update to use query params instead of body |
| **High** | H7 | Add Amharic (am) to LanguageSelectPage for Ethiopia |
| **High** | H8 | Fix country field lookup: .code → .country_code |
| **Medium** | M8 | Add branding (logo, app name) to onboarding pages |
| **Medium** | M9 | Filter languages by user's country/region |
| **Medium** | M10 | Add visual progress bar component |
| **Medium** | M11 | Ask permission before auto-fetching location |
| **Medium** | M12 | Add skip buttons/indicators for optional fields |
| **Medium** | M13 | Persist onboarding state in localStorage/IndexedDB |
| **Medium** | M14 | Remove default role selection |
| **Low** | L3 | Add type-specific icons for organizations |
| **Low** | L4 | Enhance role cards with larger icons/illustrations |

---

---

## Module 3: Home Dashboard

**Review Date:** 2026-02-06
**Status:** ✅ Complete
**Gaps Found:** 14 (1 Critical, 3 High, 7 Medium, 2 Low)

### 3.1 Database Dependencies

The home dashboard relies on data from multiple tables:
- `cow_profiles` - For cow count and list
- `milk_logs` / `yield_data` - For today's milk production
- `bot_diet_history` - For recent diet plans
- `farmer_profiles` - For managed farmers (extension workers)

No direct database issues - all tables exist with proper schemas.

---

### 3.2 Backend API Dependencies

**Endpoints Used:**
| Endpoint | Store | Purpose |
|----------|-------|---------|
| GET /api/v1/cows | cows.ts | Fetch user's cows |
| GET /api/v1/milk-logs | milkLogs.ts | Fetch milk production logs |
| GET /api/v1/diet/history | diets.ts | Fetch diet history |
| GET /api/v1/farmer-profiles | farmers.ts | Fetch managed farmers |

All endpoints are properly implemented in the backend. API adapter maps `/api/v1/*` to backend routes.

---

### 3.3 Frontend Implementation

**Page Structure:**
```
HomePage.vue
├── PullToRefresh
├── ExtensionWorkerDashboard (if extension worker OR managing farmers)
│   └── slot: FarmerDashboard (personal view)
└── FarmerDashboard (if regular farmer)
```

**FarmerDashboard Components:**
| Section | Data Source | Status |
|---------|-------------|--------|
| Welcome | authStore.user.name | ✅ Working |
| Greeting | Time-based computed | ✅ Working |
| Cow Count | cowsStore.cowCount | ✅ Working |
| Today's Milk | milkLogsStore.todayTotal | ✅ Working |
| Quick Actions | Static routes | ⚠️ Routes may not exist |
| Today's Logs | milkLogsStore.todayLogs | ✅ Working |
| Recent Diets | dietsStore.recentDiets | ✅ Working |

**ExtensionWorkerDashboard Components:**
| Section | Data Source | Status |
|---------|-------------|--------|
| View Toggle | Local state | ✅ Working |
| Welcome | authStore.user.name | ✅ Working |
| Farmers Managed | farmersStore.activeFarmerCount | ✅ Working |
| Total Cows | Computed from farmers | ✅ Working |
| Total Milk | Computed (returns 0) | ❌ **NOT IMPLEMENTED** |
| Quick Actions | Static routes | ✅ Working |
| Farmers List | farmersStore.activeFarmers | ✅ Working (limited to 5) |
| Recent Activity | Placeholder | ❌ **NOT IMPLEMENTED** |

**⚠️ GAP C6:** The `totalMilk` computed in ExtensionWorkerDashboard has a TODO:
```javascript
// TODO: Calculate total milk from all farmers' cows
// For now, return 0 - will be implemented with milk log aggregation
const totalMilk = computed(() => 0);
```

---

### 3.4 Store Analysis

**cows.ts:**
- ✅ Good offline support with optimistic updates
- ✅ Proper IndexedDB caching
- ⚠️ **GAP H9:** Filters by `user_id` only, not `farmer_profile_id`
  - Extension workers viewing a managed farmer's cows won't work correctly

**milkLogs.ts:**
- ✅ Good offline support
- ✅ Excellent computed summaries:
  - `todayLogs` - Logs for current date
  - `todayTotal` - Sum of today's milk
  - `thisWeekSummary` - Weekly aggregation
  - `thisMonthSummary` - Monthly aggregation
- ✅ Calculates `total_liters` from morning + evening

**diets.ts:**
- ✅ Correctly requires online for optimization
- ✅ Good local caching for diet history
- ✅ Placeholder diet during optimization (good UX)

**farmers.ts:**
- ✅ Good offline support with sync queue
- ✅ Proper IndexedDB caching
- ✅ `isManagingFarmers` computed for dashboard toggle

---

### 3.5 UI/UX Review

**Current Design (FarmerDashboard):**
```
┌─────────────────────────────────────┐
│  Welcome, [Name]!                   │
│  Good morning                       │
├─────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐          │
│  │    3    │  │  12.5L  │          │
│  │ Active  │  │ Today's │          │
│  │  Cows   │  │  Milk   │          │
│  └─────────┘  └─────────┘          │
├─────────────────────────────────────┤
│  Quick Actions                      │
│  ┌────┐ ┌────┐ ┌────┐              │
│  │💧  │ │🍽  │ │➕  │              │
│  │Log │ │Get │ │Add │              │
│  │Milk│ │Diet│ │Cow │              │
│  └────┘ └────┘ └────┘              │
├─────────────────────────────────────┤
│  Today's Logs                       │
│  ┌─────────────────────────────┐   │
│  │ 🐄 Lakshmi                   │   │
│  │    Morning: 5L  Evening: 4L │   │
│  │                         9L  │   │
│  └─────────────────────────────┘   │
├─────────────────────────────────────┤
│  Recent Diets                       │
│  ┌─────────────────────────────┐   │
│  │ Lakshmi         [completed] │   │
│  │ Feb 5, 2026                 │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Issues Identified:**

**⚠️ GAP M15: No Branding**
- No app logo
- Just plain "Welcome, [Name]!"
- No visual identity on home page

**⚠️ GAP M16: Basic Statistics**
- Just numbers with labels
- No trend indicators (↑↓)
- No mini-charts or sparklines
- No comparison to previous period

**⚠️ GAP M17: No Error Display**
- Stores track `error` state
- FarmerDashboard doesn't display errors to user
- Silent failures possible

**⚠️ GAP M18: Grey Icon Empty States**
- Empty states show grey Material icons
- No illustrations or engaging visuals
- Less motivating for new users

**⚠️ GAP M19: No Onboarding Help**
- No tooltips for first-time users
- No "Did you know?" tips
- No guided prompts to explore features

**⚠️ GAP M20: No Notifications**
- No alerts section
- No reminders display
- Backend has reminder settings but no UI

**⚠️ GAP M21: Truncated Farmers List**
- ExtensionWorkerDashboard shows max 5 farmers
- No "Load more" or pagination
- "View All" link exists but list is truncated

**⚠️ GAP H10: Recent Activity Not Implemented**
- Shows placeholder: "Select a farmer first"
- Should show recent actions across all managed farmers
- Activity feed would be valuable for extension workers

**⚠️ GAP H11: Route Verification Needed**
- Quick actions link to:
  - `/logs/new` - Milk logging
  - `/diet/new` - Diet creation
  - `/cows/new` - Cow creation
- Need to verify these routes exist in router

---

### 3.6 Iconography Review

**Current Icons:**
| Element | Icon | Assessment |
|---------|------|------------|
| Cow avatar | `pets` | ⚠️ Generic - consider cow icon |
| Milk log | `water_drop` | ✅ Good |
| Diet | `restaurant` | ✅ Good |
| Add cow | `add` | ✅ Simple but effective |
| Farmers managed | `groups` | ✅ Good |
| Personal farm | `home` | ✅ Good |
| Quick action buttons | Various | ✅ Appropriate |
| Empty state (milk) | `water_drop` (grey) | ⚠️ Could be illustration |
| Empty state (diet) | `restaurant` (grey) | ⚠️ Could be illustration |

**Recommendations:**
- Consider custom cow icon instead of generic `pets`
- Replace grey icon empty states with illustrations
- Add micro-animations to quick action buttons

---

### 3.7 Typography Review

**Current State:**
- Welcome: `text-h5`
- Greeting: `text-body2 text-grey-7`
- Stats numbers: `text-h4 text-primary`/`text-secondary`
- Stats labels: `text-caption text-grey-7`
- Section headers: `text-subtitle1`

**Assessment:**
- ✅ Good hierarchy (h5 > h4 > subtitle1 > body2 > caption)
- ✅ Appropriate use of color for emphasis
- ⚠️ Stats numbers could be larger/bolder
- ⚠️ Consider different font weights for variety

---

### 3.8 Offline Support Review

**FarmerDashboard:**
- ✅ Cows store has offline support
- ✅ Milk logs store has offline support
- ✅ Diets store has offline support (read-only)
- ✅ Skeleton loaders during loading

**ExtensionWorkerDashboard:**
- ✅ Farmers store has offline support
- ⚠️ Farmers store clears IndexedDB on fetch (may lose offline data)

**Pull-to-Refresh:**
- ✅ Implemented via PullToRefresh component
- ✅ Properly awaits data refresh

---

### 3.9 Actions Required

| Priority | Gap ID | Action |
|----------|--------|--------|
| **Critical** | C6 | Implement totalMilk aggregation for extension workers |
| **High** | H9 | Add farmer_profile_id filter to cows store for extension workers |
| **High** | H10 | Implement Recent Activity feed for extension workers |
| **High** | H11 | Verify/create routes for /logs/new, /diet/new, /cows/new |
| **Medium** | M15 | Add app branding to home dashboard |
| **Medium** | M16 | Add trend indicators and mini-charts to stats |
| **Medium** | M17 | Display store errors in FarmerDashboard UI |
| **Medium** | M18 | Replace grey icon empty states with illustrations |
| **Medium** | M19 | Add onboarding tooltips/prompts for new users |
| **Medium** | M20 | Add notifications/alerts section |
| **Medium** | M21 | Add pagination to ExtensionWorkerDashboard farmers list |
| **Low** | L5 | Add micro-interactions to quick action buttons |
| **Low** | L6 | Consider weather widget integration |

---

---

## Module 4: Cow Management

**Review Date:** 2026-02-06
**Status:** ✅ Complete
**Gaps Found:** 11 (0 Critical, 2 High, 6 Medium, 2 Low)

### 4.1 Database Schema

**Tables:**
- `cow_profiles` - Core cow data

**cow_profiles columns:**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | FK to user_information |
| farmer_profile_id | UUID | FK to farmer_profiles (nullable) |
| name | VARCHAR(100) | Required |
| breed | VARCHAR(50) | Required |
| weight_kg | DECIMAL(10,2) | Required |
| age_months | INTEGER | Optional |
| milk_yield_liters | DECIMAL(10,2) | Daily average |
| milk_fat_percentage | DECIMAL(5,2) | Required |
| lactation_stage | VARCHAR(20) | early/mid/late/dry |
| body_condition_score | INTEGER | 1-5 scale |
| is_pregnant | BOOLEAN | Default false |
| pregnancy_month | INTEGER | 1-9 if pregnant |
| activity_level | VARCHAR(20) | low/normal/high |
| notes | TEXT | Optional |
| is_active | BOOLEAN | Soft delete |
| created_at | TIMESTAMP | Auto |
| updated_at | TIMESTAMP | Auto |

**Schema Assessment:**
- ✅ Good: Comprehensive cow attributes
- ✅ Good: farmer_profile_id for extension worker support
- ⚠️ Missing: No image/photo URL field
- ⚠️ Missing: No color/tag field for identification
- ⚠️ Missing: No health_history relationship

---

### 4.2 Backend API

**Endpoints:**
| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/v1/cows | List user's cows |
| POST | /api/v1/cows | Create new cow |
| GET | /api/v1/cows/{id} | Get cow details |
| PUT | /api/v1/cows/{id} | Update cow |
| DELETE | /api/v1/cows/{id} | Delete cow |
| GET | /auth/breeds/{country_id} | Get breeds by country |

**Breed API exists but not used:**
- Backend has `/auth/breeds/{country_id}` endpoint
- Returns country-specific breeds
- Frontend hardcodes breed list instead

**⚠️ GAP H12:** Breeds should be fetched from API based on user's country.

---

### 4.3 Frontend Implementation

**Pages:**
| Page | Route | Purpose |
|------|-------|---------|
| CowListPage | /cows | List all cows with search |
| CowFormPage | /cows/new | Create new cow |
| CowFormPage | /cows/:id/edit | Edit existing cow |
| CowDetailPage | /cows/:id | View cow details |

**CowListPage Features:**
- ✅ Search by name and breed
- ✅ Pull-to-refresh
- ✅ Sync status indicator (pending chip)
- ✅ Skeleton loading
- ✅ FAB for adding new cow
- ✅ Empty state with action
- ⚠️ Uses generic `pets` icon
- ⚠️ No bulk selection/actions
- ⚠️ All text hardcoded English

**CowFormPage Features:**
- ✅ Form validation with rules
- ✅ Section organization (Basic, Milk, Health)
- ✅ Delete confirmation dialog
- ✅ Loading state on submit
- ✅ Error banner display
- ✅ Conditional pregnancy month field
- ⚠️ Hardcoded breed options (not API)
- ⚠️ All labels hardcoded English
- ⚠️ Validation messages hardcoded
- ⚠️ No image upload

**CowDetailPage Features:**
- ✅ Header card with avatar
- ✅ Quick stats (weight, yield, fat%)
- ✅ Details list
- ✅ Quick actions (Log Milk, Get Diet)
- ✅ Recent milk logs section
- ✅ Edit FAB
- ✅ Not found empty state
- ⚠️ Uses generic `pets` icon
- ⚠️ No trend indicators
- ⚠️ All text hardcoded English

---

### 4.4 Store Analysis (cows.ts)

**State:**
- `cows` - Array of cow objects
- `loading` - Loading state
- `error` - Error message

**Computed:**
- `activeCows` - Filtered active, non-deleted cows
- `cowCount` - Count of active cows

**Actions:**
- ✅ `fetchCows()` - Offline-aware with IndexedDB fallback
- ✅ `getCow(id)` - Local-first lookup
- ✅ `createCow(input)` - Optimistic with sync queue
- ✅ `updateCow(id, input)` - Optimistic with sync queue
- ✅ `deleteCow(id)` - Soft delete with sync queue
- ✅ `toggleCowActive(id)` - Archive/restore

**Offline Support Assessment:**
- ✅ Excellent optimistic updates
- ✅ IndexedDB caching via Dexie
- ✅ Sync queue for offline changes
- ✅ Graceful fallback to local data
- ⚠️ Filters only by `user_id`, not `farmer_profile_id` (covered in H9)

---

### 4.5 UI/UX Review

**Current Design (CowListPage):**
```
┌─────────────────────────────────────┐
│  ┌─────────────────────────────┐   │
│  │ 🔍 Search cows...           │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🐾 Lakshmi          [Pending]│   │
│  │    Jersey · 400kg · 12L/day  │ > │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 🐾 Ganga                     │   │
│  │    Sahiwal · 350kg · 8L/day  │ > │
│  └─────────────────────────────┘   │
│                                     │
│                           ┌───┐    │
│                           │ + │    │
│                           └───┘    │
└─────────────────────────────────────┘
```

**Issues Identified:**

**⚠️ GAP H13: Not Internationalized**
- All form labels in English
- Validation messages in English
- Button text in English
- Empty state text in English
- Backend has i18n support but frontend doesn't use it

**⚠️ GAP M22: Generic Icon**
- Uses `pets` icon (generic animal)
- Should use cow-specific icon
- Consider custom cow SVG or icon library

**⚠️ GAP M23: No Image Upload**
- Cows often have distinctive markings
- Photo would help identification
- Could use camera or gallery

**⚠️ GAP M24: No Trends**
- Quick stats show current values only
- No comparison to previous week/month
- No up/down trend indicators

**⚠️ GAP M25: Validation Not Translated**
- "Name is required" - hardcoded
- "Weight must be greater than 0" - hardcoded
- Should use `$t()` for all messages

**⚠️ GAP M26: No Bulk Actions**
- Cannot select multiple cows
- No bulk archive/delete
- Tedious for farmers with many cows

**⚠️ GAP M27: No Color/Tag Field**
- Many farmers identify cows by color
- No tag/ear tag number field
- Common practice in dairy farming

---

### 4.6 Iconography Review

**Current Icons:**
| Element | Icon | Assessment |
|---------|------|------------|
| Cow avatar | `pets` | ⚠️ Generic - needs cow icon |
| Search | `search` | ✅ Good |
| Clear search | `close` | ✅ Good |
| Sync pending | `sync` | ✅ Good |
| Navigate | `chevron_right` | ✅ Good |
| Add | `add` | ✅ Good |
| Edit | `edit` | ✅ Good |
| Log milk | `water_drop` | ✅ Good |
| Get diet | `restaurant` | ✅ Good |
| Error | `error_outline` | ✅ Good |

**Recommendations:**
- Replace `pets` with cow-specific icon
- Consider: `mdi-cow`, custom SVG, or Unicode 🐄
- Use outline style for consistency

---

### 4.7 Typography Review

**Current State:**
- Page titles: `text-h5` (from layout)
- Cow name: `text-h5`
- Breed: `text-body2 text-grey-7`
- Stats numbers: `text-h6 text-primary`
- Stats labels: `text-caption text-grey-7`
- Section headers: `text-subtitle1 text-weight-medium`
- Form labels: Quasar default
- List item labels: `q-item-label`

**Assessment:**
- ✅ Good hierarchy
- ✅ Consistent Quasar classes
- ⚠️ Stats numbers could be bolder
- ⚠️ Consider larger touch targets for mobile

---

### 4.8 Offline Support Review

**CowListPage:**
- ✅ Loads from IndexedDB if offline
- ✅ Pull-to-refresh syncs when online
- ✅ Shows sync status chip

**CowFormPage:**
- ✅ Creates locally first (optimistic)
- ✅ Queues for sync if offline
- ✅ Updates work offline

**CowDetailPage:**
- ✅ Gets cow from local database first
- ✅ Shows sync status
- ⚠️ Recent logs may not load if never fetched

---

### 4.9 Actions Required

| Priority | Gap ID | Action |
|----------|--------|--------|
| **High** | H12 | Fetch breeds from `/auth/breeds/{country_id}` API |
| **High** | H13 | Internationalize all text using `$t()` calls |
| **Medium** | M22 | Replace `pets` icon with cow-specific icon |
| **Medium** | M23 | Add cow photo upload (camera/gallery) |
| **Medium** | M24 | Add trend indicators to quick stats |
| **Medium** | M25 | Translate validation messages |
| **Medium** | M26 | Add bulk selection and actions |
| **Medium** | M27 | Add color/tag fields to cow form and model |
| **Low** | L7 | Add milk yield trend chart to detail page |
| **Low** | L8 | Add health history/events tracking |

---

---

---

## Module 5: Diet Optimization

**Review Date:** 2026-02-06
**Status:** ✅ Complete
**Gaps Found:** 10 (0 Critical, 2 High, 5 Medium, 2 Low)

### 5.1 Database Schema

**Tables:**
- `bot_diet_history` - Diet optimization records and results

**bot_diet_history columns:**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | FK to user_information |
| cow_id | UUID | FK to cow_profiles (nullable) |
| cow_name | VARCHAR | For display |
| optimization_goal | VARCHAR | minimize_cost/maximize_milk/balanced |
| status | VARCHAR | pending/processing/completed/failed |
| input_data | JSONB | Cow details and constraints |
| result_data | JSONB | Feed recommendations and nutrient balance |
| total_cost | DECIMAL | Daily diet cost |
| dm_intake | DECIMAL | Dry matter intake |
| cp_percentage | DECIMAL | Crude protein % |
| tdn_percentage | DECIMAL | TDN % |
| created_at | TIMESTAMP | Auto |
| updated_at | TIMESTAMP | Auto |

**Schema Assessment:**
- ✅ Good: Comprehensive result storage
- ✅ Good: JSONB for flexible input/output data
- ✅ Good: Links to cow_profiles
- ⚠️ Missing: farmer_profile_id for extension worker support
- ⚠️ Missing: currency field for multi-country support

---

### 5.2 Backend API

**Endpoints:**
| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/v1/diet/history | List diet history |
| GET | /api/v1/diet/{id} | Get diet details |
| POST | /api/v1/diet/optimize | Run diet optimization |
| POST | /api/v1/diet/{id}/evaluate | Compare actual vs recommended |
| DELETE | /api/v1/diet/{id} | Delete diet record |

**Optimization Request:**
```json
{
  "cow_id": "uuid (optional)",
  "cow_name": "string (optional)",
  "weight_kg": "number (required)",
  "milk_yield_liters": "number",
  "milk_fat_percentage": "number",
  "lactation_stage": "early|mid|late|dry",
  "is_pregnant": "boolean",
  "pregnancy_month": "number (1-9)",
  "activity_level": "low|normal|high",
  "optimization_goal": "minimize_cost|maximize_milk|balanced",
  "available_feeds": ["feed_id1", "feed_id2"],
  "budget_per_day": "number (optional)"
}
```

**API Assessment:**
- ✅ Good: Comprehensive optimization parameters
- ✅ Good: Evaluation endpoint for comparison
- ✅ Good: Returns recommendations and warnings
- ⚠️ Missing: Body condition score in input
- ⚠️ Missing: Age in input
- ⚠️ Missing: Currency parameter

---

### 5.3 Frontend Implementation

**Pages:**
| Page | Route | Purpose |
|------|-------|---------|
| DietListPage | /diet | List diet history |
| DietWizardPage | /diet/new | Multi-step diet creation wizard |
| DietDetailPage | /diet/:id | View diet details and results |

**DietListPage Features:**
- ✅ Pull-to-refresh
- ✅ Status colors and icons
- ✅ Skeleton loading
- ✅ Summary stats (DM, Goal, Cost)
- ✅ FAB for new diet
- ⚠️ Currency hardcoded as ₹
- ⚠️ All text hardcoded English

**DietWizardPage Features (5 Steps):**
1. **Select Cow** - Choose from cows or enter manually
2. **Animal Details** - Weight, yield, fat%, lactation, pregnancy
3. **Select Feeds** - Search and select available feeds
4. **Optimization Goal** - Min Cost / Max Milk / Balanced
5. **Review** - Summary before submission

- ✅ Pre-fills data when cow selected
- ✅ Feed search functionality
- ✅ Goal descriptions with icons
- ✅ Offline warning
- ✅ Minimum feed validation (3 feeds recommended)
- ⚠️ Missing body condition score input
- ⚠️ Missing age input
- ⚠️ Generic `pets` icon for cow step
- ⚠️ All text hardcoded English
- ⚠️ Currency hardcoded as ₹

**DietDetailPage Features:**
- ✅ Status banner for processing/failed
- ✅ Summary stats (Cost, DM, Feed count)
- ✅ Feed breakdown with amounts and costs
- ✅ Nutrient balance with progress bars
- ✅ Recommendations list
- ✅ Warnings list
- ✅ Delete confirmation
- ⚠️ No share/export option
- ⚠️ No "regenerate" option
- ⚠️ No print view
- ⚠️ All text hardcoded English
- ⚠️ Currency hardcoded as ₹

---

### 5.4 Store Analysis (diets.ts)

**State:**
- `diets` - Array of diet records
- `currentDiet` - Currently viewed diet
- `loading` - Loading state
- `optimizing` - Optimization in progress
- `error` - Error message

**Computed:**
- `completedDiets` - Only completed diets
- `recentDiets` - Last 10 diets sorted by date

**Actions:**
- ✅ `fetchDiets()` - With IndexedDB caching
- ✅ `getDiet(id)` - Local-first lookup
- ✅ `optimizeDiet(input)` - Creates placeholder during optimization
- ✅ `evaluateDiet(id, actualFeeds)` - Compare actual vs recommended
- ✅ `deleteDiet(id)` - Remove diet
- ✅ `getDietsForCow(cowId)` - Filter by cow

**Offline Support Assessment:**
- ✅ Good: Diet history cached in IndexedDB
- ✅ Good: Graceful offline fallback for viewing
- ✅ Good: Clear error message when optimization attempted offline
- ⚠️ Limitation: Optimization requires internet (expected)
- ⚠️ No retry queue for failed optimizations

---

### 5.5 UI/UX Review

**Diet Wizard Wireframe:**
```
┌─────────────────────────────────────┐
│  Diet Wizard                        │
│  ════════════════════════════════   │
│  [1]─[2]─[3]─[4]─[5]  Progress     │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Select a cow or enter      │   │
│  │  details manually           │   │
│  │                             │   │
│  │  ○ Select from my cows      │   │
│  │  ○ Enter manually           │   │
│  │                             │   │
│  │  [Select Cow         ▼]     │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌────────┐  ┌────────┐            │
│  │  Back  │  │Continue│            │
│  └────────┘  └────────┘            │
└─────────────────────────────────────┘
```

**Issues Identified:**

**⚠️ GAP H14: Hardcoded Currency**
- `₹{{ diet.total_cost.toFixed(2) }}/day` - Indian Rupee
- Should use user's country currency
- Backend sends amounts, frontend should format based on locale

**⚠️ GAP H15: No Internationalization**
- All wizard step titles in English
- All labels and hints in English
- Goal descriptions in English
- Should use `$t()` for all user-visible text

**⚠️ GAP M28: No Export/Share**
- No way to save diet as PDF
- No WhatsApp share (common in India)
- No print-friendly view
- Farmers often need to share with family/workers

**⚠️ GAP M29: No Regenerate**
- If diet fails or is suboptimal, must restart wizard
- Should have "Try Again" button on failed diets
- Should allow tweaking parameters and re-optimizing

**⚠️ GAP M30: Missing Inputs**
- DietWizard doesn't ask for body condition score
- DietWizard doesn't ask for age
- Both affect nutritional requirements
- CowFormPage has these, wizard should too (or auto-fill from cow)

**⚠️ GAP M31: No Diet Comparison**
- Can't compare two diet plans side by side
- Can't see trade-offs between cost vs nutrition
- Would help decision making

**⚠️ GAP M32: No Feed Availability**
- Shows all feeds without availability status
- User may select feeds they don't currently have
- Should indicate stock level or availability

---

### 5.6 Iconography Review

**Current Icons:**
| Element | Icon | Assessment |
|---------|------|------------|
| Cow step | `pets` | ⚠️ Generic - needs cow icon |
| Details step | `info` | ✅ Good |
| Feeds step | `grass` | ✅ Good |
| Goal step | `flag` | ✅ Good |
| Review step | `check` | ✅ Good |
| Minimize cost | `savings` | ✅ Good |
| Maximize milk | `water_drop` | ✅ Good |
| Balanced | `balance` | ✅ Good |
| Completed | `check`/`check_circle` | ✅ Good |
| Processing | `hourglass_empty` | ✅ Good |
| Failed | `error` | ✅ Good |
| Recommendation | `lightbulb` | ✅ Good |
| Warning | `warning` | ✅ Good |

---

### 5.7 Typography Review

**Current State:**
- Section titles: `text-subtitle1 q-mb-md`
- Stats numbers: `text-h5 text-primary`
- Stats labels: `text-caption text-grey-7`
- Feed names: `q-item-label`
- Feed details: `q-item-label caption`

**Assessment:**
- ✅ Consistent with other modules
- ✅ Good use of color for emphasis
- ⚠️ Nutrient names could be more prominent

---

### 5.8 Offline Support Review

**DietListPage:**
- ✅ Loads from IndexedDB if offline
- ✅ Shows cached diet history

**DietWizardPage:**
- ✅ Shows offline warning banner
- ✅ Disables submit when offline
- ⚠️ No way to queue for later

**DietDetailPage:**
- ✅ Loads cached diet details
- ✅ Shows sync status

---

### 5.9 Actions Required

| Priority | Gap ID | Action |
|----------|--------|--------|
| **High** | H14 | Implement dynamic currency formatting based on user's country |
| **High** | H15 | Internationalize all text using `$t()` calls |
| **Medium** | M28 | Add export/share options (PDF, WhatsApp, print) |
| **Medium** | M29 | Add regenerate button for failed/completed diets |
| **Medium** | M30 | Add body condition score and age to DietWizard |
| **Medium** | M31 | Add diet comparison view |
| **Medium** | M32 | Show feed availability/stock status |
| **Low** | L9 | Add historical diet cost comparison chart |
| **Low** | L10 | Add diet reminder/notification integration |

---

---

## Module 6: Milk Logging

**Review Date:** 2026-02-06
**Status:** ✅ Complete
**Gaps Found:** 8 (0 Critical, 1 High, 4 Medium, 2 Low)

### 6.1 Database Schema

**Tables:**
- `milk_logs` / `yield_data` - Daily milk production records

**milk_logs columns:**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | FK to user_information |
| cow_id | UUID | FK to cow_profiles |
| cow_name | VARCHAR | Denormalized for display |
| log_date | DATE | Required |
| morning_liters | DECIMAL(10,2) | Morning milking |
| evening_liters | DECIMAL(10,2) | Evening milking |
| total_liters | DECIMAL(10,2) | Computed sum |
| fat_percentage | DECIMAL(5,2) | Optional quality metric |
| notes | TEXT | Optional observations |
| created_at | TIMESTAMP | Auto |
| updated_at | TIMESTAMP | Auto |

**Schema Assessment:**
- ✅ Good: Comprehensive milk tracking fields
- ✅ Good: Morning/evening split for accurate tracking
- ✅ Good: Fat percentage for quality tracking
- ⚠️ Missing: farmer_profile_id for extension worker support
- ⚠️ Missing: SNF (solids-not-fat) percentage
- ⚠️ Missing: Milk temperature at collection
- ⚠️ Missing: Price per liter for revenue tracking

---

### 6.2 Backend API

**Endpoints:**
| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/v1/milk-logs | List milk logs (with filters) |
| POST | /api/v1/milk-logs | Create new log |
| GET | /api/v1/milk-logs/{id} | Get log details |
| PUT | /api/v1/milk-logs/{id} | Update log |
| DELETE | /api/v1/milk-logs/{id} | Delete log |

**Query Parameters (GET /api/v1/milk-logs):**
- `cow_id` - Filter by specific cow
- `start_date` - Filter from date
- `end_date` - Filter to date

**API Assessment:**
- ✅ Good: Full CRUD operations
- ✅ Good: Date range filtering
- ✅ Good: Cow-specific filtering
- ⚠️ Missing: Aggregation endpoint for summaries
- ⚠️ Missing: Bulk create for multiple cows at once

---

### 6.3 Frontend Implementation

**Pages:**
| Page | Route | Purpose |
|------|-------|---------|
| LogListPage | /logs | List all milk logs with filters |
| LogFormPage | /logs/new | Create new milk log |
| LogFormPage | /logs/:id/edit | Edit existing log |

**LogListPage Features:**
- ✅ Summary cards (Today, This Week totals)
- ✅ Cow filter dropdown
- ✅ Date range picker dialog
- ✅ Grouped by date ("Today", "Yesterday", "Date")
- ✅ Skeleton loading
- ✅ Pull-to-refresh
- ✅ Sync status indicator (Pending chip)
- ✅ FAB for new log
- ⚠️ Generic `pets` icon for cow
- ⚠️ All text hardcoded English
- ⚠️ No trend visualization
- ⚠️ No quick actions for common entries

**LogFormPage Features:**
- ✅ Cow selection dropdown
- ✅ Date picker (defaults to today)
- ✅ Morning/Evening split inputs with icons
- ✅ Real-time total calculation display
- ✅ Optional fat percentage
- ✅ Notes field
- ✅ Delete button for edit mode
- ✅ Pre-fills cow_id from query params
- ✅ Validation rules
- ⚠️ Generic `pets` icon in cow selector
- ⚠️ All text hardcoded English
- ⚠️ No duplicate log detection
- ⚠️ No quick entry for multiple cows

---

### 6.4 Store Analysis (milkLogs.ts)

**State:**
- `logs` - Array of milk log objects
- `loading` - Loading state
- `error` - Error message

**Computed:**
- `recentLogs` - Last 20 logs sorted by date
- `todayLogs` - Logs for current date
- `todayTotal` - Sum of today's milk
- `thisWeekSummary` - Weekly aggregation (total, average, by cow)
- `thisMonthSummary` - Monthly aggregation

**Actions:**
- ✅ `fetchLogs(params)` - With IndexedDB caching and filters
- ✅ `getLog(id)` - Local-first lookup
- ✅ `createLog(input)` - Optimistic with sync queue
- ✅ `updateLog(id, input)` - Optimistic with sync queue
- ✅ `deleteLog(id)` - Soft delete with sync queue
- ✅ `getLogsForCow(cowId)` - Filter by cow
- ✅ `getLogByDate(cowId, date)` - Check for existing log (not used in UI!)

**Offline Support Assessment:**
- ✅ Excellent: Optimistic creates/updates/deletes
- ✅ Excellent: IndexedDB caching via Dexie
- ✅ Excellent: Sync queue for offline changes
- ✅ Good: Graceful fallback to local data
- ⚠️ Note: `getLogByDate` exists but LogFormPage doesn't use it for duplicate detection

---

### 6.5 UI/UX Review

**Current Design (LogListPage):**
```
┌─────────────────────────────────────┐
│  ┌─────────┐  ┌─────────┐          │
│  │ Today   │  │This Week│          │
│  │  12.5L  │  │  85.2L  │          │
│  └─────────┘  └─────────┘          │
│                                     │
│  [Filter by Cow ▼]            [📅] │
│                                     │
│  Today                              │
│  ┌─────────────────────────────┐   │
│  │ 🐾 Lakshmi    [Pending]      │   │
│  │    M: 5L  E: 4L          9L  │ > │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 🐾 Ganga                     │   │
│  │    M: 4L  E: 3.5L       7.5L │ > │
│  └─────────────────────────────┘   │
│                                     │
│  Yesterday                          │
│  ┌─────────────────────────────┐   │
│  │ 🐾 Lakshmi                   │   │
│  │    M: 5.5L  E: 4.5L      10L │ > │
│  └─────────────────────────────┘   │
│                           ┌───┐    │
│                           │ + │    │
│                           └───┘    │
└─────────────────────────────────────┘
```

**Issues Identified:**

**⚠️ GAP H16: No Internationalization**
- "Today", "This Week" - hardcoded English
- "Filter by Cow", "All Cows" - hardcoded
- "No Milk Logs" - hardcoded
- "M: / E:" abbreviations - hardcoded
- Date headers ("Today", "Yesterday") - hardcoded
- All form labels, hints, validation messages - hardcoded
- Should use `$t()` for all user-visible text

**⚠️ GAP M33: Generic Icon**
- Uses `pets` icon (generic animal)
- Should use cow-specific icon
- Both in list avatars and form selector

**⚠️ GAP M34: No Duplicate Detection**
- Store has `getLogByDate(cowId, date)` function
- LogFormPage doesn't use it to warn about existing logs
- User could accidentally create duplicate entries
- Should show warning: "Log already exists for this cow on this date"

**⚠️ GAP M35: No Quick Entry Mode**
- Must select cow, enter values, save, repeat
- Large herds need faster workflow
- Could have multi-cow entry screen
- Or "Next Cow" button after saving

**⚠️ GAP M36: Limited Quality Metrics**
- Only fat percentage tracked
- SNF (solids-not-fat) common in dairy
- Milk temperature important for freshness
- Could add optional quality fields

---

### 6.6 Iconography Review

**Current Icons:**
| Element | Icon | Assessment |
|---------|------|------------|
| Cow avatar | `pets` | ⚠️ Generic - needs cow icon |
| Milk drop | `water_drop` | ✅ Good |
| Calendar | `calendar_today` | ✅ Good |
| Morning | `wb_sunny` | ✅ Good |
| Evening | `nightlight` | ✅ Good |
| Fat | `opacity` | ✅ Good |
| Sync | `sync` | ✅ Good |
| Add | `add` | ✅ Good |
| Navigate | `chevron_right` | ✅ Good |

**Recommendations:**
- Replace `pets` with cow-specific icon
- Morning/Evening icons are excellent visual cues

---

### 6.7 Typography Review

**Current State:**
- Summary card labels: `text-caption text-grey-7`
- Summary card values: `text-h5 text-primary/secondary`
- Date headers: `text-subtitle2 text-grey-7`
- Cow name: `q-item-label`
- Milk amounts: `text-h6 text-primary`
- Form sections: `text-subtitle2`
- Total display: `text-h4 text-primary`

**Assessment:**
- ✅ Good hierarchy
- ✅ Strong visual emphasis on totals
- ✅ Consistent with other modules
- ✅ Morning/Evening abbreviations work well in mobile space

---

### 6.8 Offline Support Review

**LogListPage:**
- ✅ Loads from IndexedDB if offline
- ✅ Shows sync status chip
- ✅ Pull-to-refresh syncs when online

**LogFormPage:**
- ✅ Creates locally first (optimistic)
- ✅ Queues for sync if offline
- ✅ Updates work offline
- ✅ Deletes work offline

**Summary Stats:**
- ✅ Computed from local data
- ✅ Work correctly offline

---

### 6.9 Actions Required

| Priority | Gap ID | Action |
|----------|--------|--------|
| **High** | H16 | Internationalize all text using `$t()` calls |
| **Medium** | M33 | Replace `pets` icon with cow-specific icon |
| **Medium** | M34 | Add duplicate log detection using `getLogByDate` |
| **Medium** | M35 | Add quick entry mode for multiple cows |
| **Medium** | M36 | Add optional SNF and temperature fields |
| **Low** | L11 | Add milk price tracking for revenue calculation |
| **Low** | L12 | Add milk trend mini-chart to list page |

---

---

## Module 7: Feed Management

**Review Date:** 2026-02-06
**Status:** ✅ Complete
**Gaps Found:** 8 (0 Critical, 2 High, 4 Medium, 2 Low)

### 7.1 Database Schema

**Tables:**
- `feeds` - Master and custom feed ingredients with nutritional data

**feeds columns:**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | FK to user_information (for custom feeds) |
| name | VARCHAR(255) | Required |
| category | VARCHAR(100) | Concentrate, Roughage, etc. |
| country_code | VARCHAR(10) | Country for master feeds |
| is_custom | BOOLEAN | True for user-created feeds |
| dm_percentage | DECIMAL(5,2) | Dry Matter % (required) |
| cp_percentage | DECIMAL(5,2) | Crude Protein % (required) |
| tdn_percentage | DECIMAL(5,2) | TDN % (required) |
| ndf_percentage | DECIMAL(5,2) | Neutral Detergent Fiber % (optional) |
| ca_percentage | DECIMAL(5,2) | Calcium % (optional) |
| p_percentage | DECIMAL(5,2) | Phosphorus % (optional) |
| price_per_kg | DECIMAL(10,2) | Price (optional) |
| created_at | TIMESTAMP | Auto |
| updated_at | TIMESTAMP | Auto |

**Schema Assessment:**
- ✅ Good: Comprehensive nutritional fields
- ✅ Good: Separation of master vs custom feeds
- ✅ Good: Country-specific master feeds
- ⚠️ Missing: image_url for visual identification
- ⚠️ Missing: seasonal_availability fields
- ⚠️ Missing: stock_quantity for inventory tracking
- ⚠️ Missing: currency field (assumes same as country)

---

### 7.2 Backend API

**Endpoints:**
| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/v1/feeds/master | List master feeds (by country) |
| GET | /api/v1/feeds/custom | List user's custom feeds |
| POST | /api/v1/feeds/custom | Create custom feed |
| GET | /api/v1/feeds/{id} | Get feed details |
| PUT | /api/v1/feeds/custom/{id} | Update custom feed |
| DELETE | /api/v1/feeds/custom/{id} | Delete custom feed |

**Master Feeds Query Parameters:**
- `country_code` - Filter by country (defaults to user's country)

**API Assessment:**
- ✅ Good: Separation of master and custom feed endpoints
- ✅ Good: Country-specific master feeds
- ✅ Good: Full CRUD for custom feeds
- ⚠️ Missing: Bulk operations for custom feeds

---

### 7.3 Frontend Implementation

**Pages:**
| Page | Route | Purpose |
|------|-------|---------|
| FeedListPage | /feeds | List master and custom feeds |
| FeedFormPage | /feeds/new | Create custom feed |
| FeedFormPage | /feeds/:id/edit | Edit custom feed |
| FeedDetailPage | /feeds/:id | View feed details |

**FeedListPage Features:**
- ✅ Tab toggle: Master vs Custom feeds
- ✅ Search by name and category
- ✅ Grouped by category
- ✅ Skeleton loading
- ✅ Pull-to-refresh
- ✅ Custom chip indicator
- ✅ FAB for adding custom feed (only on Custom tab)
- ⚠️ Currency hardcoded as ₹
- ⚠️ All text hardcoded English
- ⚠️ No sync status indicator

**FeedFormPage Features:**
- ✅ All nutritional fields
- ✅ Category selector with new value mode
- ✅ Validation rules
- ✅ Delete button for edit mode
- ✅ Loading states
- ⚠️ Currency prefix hardcoded as ₹
- ⚠️ All text hardcoded English
- ⚠️ Categories hardcoded in code
- ⚠️ Validation messages hardcoded

**FeedDetailPage Features:**
- ✅ Header with name and category
- ✅ Custom/Master badge
- ✅ Full nutritional composition list
- ✅ Price display
- ✅ Edit button for custom feeds
- ⚠️ Currency hardcoded as ₹
- ⚠️ All text hardcoded English

---

### 7.4 Store Analysis (feeds.ts)

**State:**
- `masterFeeds` - Array of master feeds
- `customFeeds` - Array of user's custom feeds
- `loading` - Loading state
- `error` - Error message

**Computed:**
- `allFeeds` - Combined master and custom feeds
- `feedsByCategory` - Grouped by category
- `categories` - List of unique categories

**Actions:**
- ✅ `fetchMasterFeeds(countryCode)` - With IndexedDB caching
- ✅ `fetchCustomFeeds()` - With IndexedDB caching
- ✅ `fetchAllFeeds()` - Parallel fetch both
- ✅ `getFeed(id)` - Local-first lookup
- ✅ `createCustomFeed(input)` - Optimistic with sync queue
- ✅ `updateCustomFeed(id, input)` - Optimistic with sync queue
- ✅ `deleteCustomFeed(id)` - Soft delete with sync queue
- ✅ `searchFeeds(query)` - Local search function

**Offline Support Assessment:**
- ✅ Excellent: Optimistic creates/updates/deletes for custom feeds
- ✅ Excellent: IndexedDB caching via Dexie
- ✅ Excellent: Sync queue for offline changes
- ✅ Good: Master feeds cached and used when offline
- ✅ Good: Country-specific master feed fetching

---

### 7.5 UI/UX Review

**Current Design (FeedListPage):**
```
┌─────────────────────────────────────┐
│  [Master Feeds] [My Feeds]          │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🔍 Search feeds...          │   │
│  └─────────────────────────────┘   │
│                                     │
│  Concentrate                        │
│  ┌─────────────────────────────┐   │
│  │ 🌿 Maize                     │   │
│  │    CP: 9% · TDN: 80% · DM: 88%│   │
│  │                    ₹20/kg    │ > │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 🌿 Soybean Meal              │   │
│  │    CP: 44% · TDN: 82% · DM: 90%│   │
│  │                    ₹45/kg    │ > │
│  └─────────────────────────────┘   │
│                                     │
│  Roughage                           │
│  ┌─────────────────────────────┐   │
│  │ 🌿 Paddy Straw               │   │
│  │    CP: 4% · TDN: 45% · DM: 90%│   │
│  │                    ₹8/kg     │ > │
│  └─────────────────────────────┘   │
│                           ┌───┐    │
│                           │ + │    │ (only on My Feeds tab)
│                           └───┘    │
└─────────────────────────────────────┘
```

**Issues Identified:**

**⚠️ GAP H17: Hardcoded Currency**
- `₹{{ feed.price_per_kg }}/kg` - Indian Rupee
- `prefix="₹"` in form input
- Should use user's country currency

**⚠️ GAP H18: No Internationalization**
- "Master Feeds", "My Feeds" - hardcoded
- "Search feeds..." - hardcoded
- Category names (Concentrate, Roughage, etc.) - hardcoded
- "Nutritional Composition" - hardcoded
- "Custom Feed" badge - hardcoded
- All form labels and hints - hardcoded
- Should use `$t()` for all user-visible text

**⚠️ GAP M37: Hardcoded Categories**
- Categories defined in FeedFormPage:
  - Concentrate, Roughage, Green Fodder, Dry Fodder, Silage, By-product, Mineral Mix, Other
- Not fetched from API
- Not translated/localized

**⚠️ GAP M38: No Feed Images**
- All feeds use same grass icon
- No image upload for custom feeds
- Hard to visually distinguish feeds

**⚠️ GAP M39: No Inventory Tracking**
- No quantity/stock field
- Can't mark feeds as "in stock" vs "out of stock"
- DietWizard may suggest unavailable feeds

**⚠️ GAP M40: No Seasonal Indicator**
- Green fodders are seasonal
- No way to mark feeds as seasonal
- No visibility when feeds are available

---

### 7.6 Iconography Review

**Current Icons:**
| Element | Icon | Assessment |
|---------|------|------------|
| Feed avatar | `grass` | ✅ Good and relevant |
| Search | `search` | ✅ Good |
| Clear search | `close` | ✅ Good |
| Add | `add` | ✅ Good |
| Edit | `edit` | ✅ Good |
| No results | `search_off` | ✅ Good |
| Error | `error_outline` | ✅ Good |

**Assessment:**
- ✅ Icons are appropriate for feed context
- ✅ Grass icon is relevant for animal feed
- ⚠️ All feeds use same icon regardless of category

---

### 7.7 Typography Review

**Current State:**
- Tab labels: Quasar q-tab default
- Category headers: `text-subtitle2 text-grey-7`
- Feed name: `q-item-label`
- Nutritional info: `q-item-label caption`
- Price: `q-item-label`
- Detail values: `text-h6`
- Price display: `text-h4 text-primary`

**Assessment:**
- ✅ Consistent with other modules
- ✅ Good hierarchy for detail page
- ✅ Nutritional values clearly formatted

---

### 7.8 Offline Support Review

**FeedListPage:**
- ✅ Master feeds cached in IndexedDB
- ✅ Custom feeds cached in IndexedDB
- ✅ Pull-to-refresh syncs when online
- ⚠️ No sync status indicator shown

**FeedFormPage:**
- ✅ Creates locally first (optimistic)
- ✅ Queues for sync if offline
- ✅ Updates work offline
- ✅ Deletes work offline

**FeedDetailPage:**
- ✅ Loads from local database first
- ✅ Works offline for cached feeds

---

### 7.9 Actions Required

| Priority | Gap ID | Action |
|----------|--------|--------|
| **High** | H17 | Implement dynamic currency formatting based on user's country |
| **High** | H18 | Internationalize all text using `$t()` calls |
| **Medium** | M37 | Make category options i18n translated |
| **Medium** | M38 | Add feed image upload (optional) |
| **Medium** | M39 | Add stock/inventory tracking field |
| **Medium** | M40 | Add seasonal availability indicator |
| **Low** | L13 | Add price history tracking |
| **Low** | L14 | Add feed comparison view |

---

---

## Module 8: Farmer Management (Extension Workers)

**Review Date:** 2026-02-06
**Status:** ✅ Complete
**Gaps Found:** 8 (0 Critical, 2 High, 4 Medium, 2 Low)

### 8.1 Database Schema

**Tables:**
- `farmer_profiles` - Farmer profile data (self or managed)

**farmer_profiles columns:**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| organization_id | UUID | FK to organizations (nullable) |
| managed_by_user_id | UUID | FK to user_information (required) |
| is_self_profile | BOOLEAN | True if user's own profile |
| user_id | UUID | FK to user_information (for self-profile) |
| name | VARCHAR(255) | Required |
| phone | VARCHAR(20) | Optional |
| village | VARCHAR(255) | Legacy location field |
| district | VARCHAR(255) | Legacy location field |
| state | VARCHAR(255) | Legacy location field |
| country_id | UUID | FK to country |
| latitude | DECIMAL(10,8) | GPS coordinate |
| longitude | DECIMAL(11,8) | GPS coordinate |
| level_1 - level_6 | VARCHAR(255) | Multi-country admin levels |
| total_cattle | INTEGER | Default 0 |
| land_acres | DECIMAL(10,2) | Optional |
| farming_type | VARCHAR(50) | dairy, mixed, crop |
| is_active | BOOLEAN | Soft delete |
| created_at | TIMESTAMP | Auto |
| updated_at | TIMESTAMP | Auto |

**Schema Assessment:**
- ✅ Good: Comprehensive farmer attributes
- ✅ Good: managed_by_user_id for extension worker support
- ✅ Good: Multi-level location fields
- ⚠️ Missing: profile_image_url for farmer photo
- ⚠️ Missing: preferred_language for farmer's language

---

### 8.2 Backend API

**Endpoints:**
| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/v1/farmer-profiles | List managed farmers |
| POST | /api/v1/farmer-profiles | Create farmer profile |
| GET | /api/v1/farmer-profiles/{id} | Get farmer details |
| PUT | /api/v1/farmer-profiles/{id} | Update farmer |
| DELETE | /api/v1/farmer-profiles/{id} | Archive/delete farmer |
| GET | /api/v1/farmer-profiles/{id}/summary | Get farmer statistics |
| GET | /api/v1/farmer-profiles/{id}/cows | Get farmer's cows |

**Query Parameters (GET /api/v1/farmer-profiles):**
- `user_id` - Filter by managing user
- `organization_id` - Filter by organization
- `search` - Search by name
- `include_inactive` - Include archived farmers

**Summary Response:**
```json
{
  "farmer": { ... },
  "statistics": {
    "total_active_cows": 5,
    "lactating_cows": 3,
    "dry_cows": 2,
    "total_daily_milk_production": 25.5,
    "avg_milk_per_lactating_cow": 8.5
  }
}
```

**API Assessment:**
- ✅ Good: Full CRUD operations
- ✅ Good: Summary endpoint with statistics
- ✅ Good: Farmer's cows endpoint
- ✅ Good: Search and filter options
- ⚠️ Missing: Bulk import endpoint

---

### 8.3 Frontend Implementation

**Pages:**
| Page | Route | Purpose |
|------|-------|---------|
| FarmerListPage | /farmers | List managed farmers |
| FarmerFormPage | /farmers/new | Create new farmer |
| FarmerFormPage | /farmers/:id/edit | Edit existing farmer |
| FarmerDetailPage | /farmers/:id | View farmer details and stats |

**FarmerListPage Features:**
- ✅ Search by name, village, district, phone
- ✅ Filter chips: All, Dairy, Mixed
- ✅ Pull-to-refresh
- ✅ Sync status indicator
- ✅ Skeleton loading
- ✅ FAB for adding farmer
- ✅ Empty state with action
- ⚠️ All text hardcoded English
- ⚠️ Filter chip labels hardcoded

**FarmerFormPage Features:**
- ✅ Section organization (Basic Info, Location, Farm Details)
- ✅ Archive functionality with confirmation dialog
- ✅ Form validation
- ✅ Loading states
- ⚠️ Farming type options hardcoded (Dairy, Mixed, Crop)
- ⚠️ All labels hardcoded English
- ⚠️ No farmer photo upload
- ⚠️ Validation messages hardcoded

**FarmerDetailPage Features:**
- ✅ Header with farmer name and location
- ✅ Statistics cards from summary API
- ✅ Cattle list for farmer
- ✅ Quick actions (Record Yield, View History)
- ✅ Edit button
- ⚠️ Generic `person` icon for farmer
- ⚠️ Generic `pets` icon for cattle
- ⚠️ Date formatting uses hardcoded 'en-US' locale
- ⚠️ All text hardcoded English
- ⚠️ Quick actions may link to non-existent /yields routes

---

### 8.4 Store Analysis (farmers.ts)

**State:**
- `farmers` - Array of farmer profile objects
- `currentFarmer` - Currently selected farmer
- `loading` - Loading state
- `error` - Error message

**Computed:**
- `farmerCount` - Total farmer count
- `activeFarmers` - Filtered active, non-deleted farmers
- `activeFarmerCount` - Count of active farmers
- `isManagingFarmers` - True if user has managed farmers

**Actions:**
- ✅ `fetchFarmers(options)` - With IndexedDB caching and filters
- ✅ `fetchFarmer(id)` - Local-first lookup with cache
- ✅ `createFarmer(input)` - Optimistic with sync queue
- ✅ `updateFarmer(id, input)` - Optimistic with sync queue
- ✅ `archiveFarmer(id)` - Soft delete with sync queue
- ✅ `deleteFarmer(id)` - Hard delete
- ✅ `getFarmerSummary(id)` - Statistics endpoint
- ✅ `getFarmerCows(id)` - Farmer's cows list
- ✅ `selectFarmer(farmer)` - Set current farmer
- ✅ `loadFromCache()` - Initialize from IndexedDB

**Offline Support Assessment:**
- ✅ Excellent: Optimistic creates/updates
- ✅ Excellent: IndexedDB caching via Dexie
- ✅ Excellent: Sync queue for offline changes
- ✅ Good: Cache loading on init
- ⚠️ Note: Summary and cows endpoints don't have offline fallback

---

### 8.5 UI/UX Review

**Current Design (FarmerListPage):**
```
┌─────────────────────────────────────┐
│  ┌─────────────────────────────┐   │
│  │ 🔍 Search farmers...        │   │
│  └─────────────────────────────┘   │
│                                     │
│  [All (12)] [Dairy] [Mixed]         │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 👤 Ramesh Kumar    [Pending]│   │
│  │    Anand, Gujarat            │ > │
│  │                   5 cattle   │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 👤 Meena Devi               │   │
│  │    Vidisha, MP               │ > │
│  │                   3 cattle   │   │
│  └─────────────────────────────┘   │
│                           ┌───┐    │
│                           │ + │    │
│                           └───┘    │
└─────────────────────────────────────┘
```

**Issues Identified:**

**⚠️ GAP H19: No Internationalization**
- "Search farmers..." - hardcoded English
- Filter chips "All", "Dairy", "Mixed" - hardcoded
- "No Farmers" empty state - hardcoded
- Form labels and hints - hardcoded
- Validation messages - hardcoded
- Section headers - hardcoded
- Should use `$t()` for all user-visible text

**⚠️ GAP H20: Hardcoded Date Locale**
- `new Date(dateString).toLocaleDateString('en-US', {...})`
- Hardcodes 'en-US' locale
- Should use user's locale or i18n date formatting

**⚠️ GAP M41: Generic Person Icon**
- Uses `person` icon for farmer avatar
- Could use more farmer-specific icon
- Consider: `agriculture`, farmer illustration, or custom icon

**⚠️ GAP M42: Hardcoded Farming Types**
- Options defined in FarmerFormPage:
  - 'Dairy Farming', 'Mixed Farming', 'Crop Farming'
- Not fetched from API
- Not translated/localized

**⚠️ GAP M43: No Farmer Photo**
- No profile picture for farmers
- Uses generic person icon
- Hard to visually identify farmers
- Photo would help extension workers recognize farmers

**⚠️ GAP M44: Generic Cattle Icon**
- Uses `pets` icon for cattle count in detail
- Should use cow-specific icon

---

### 8.6 Iconography Review

**Current Icons:**
| Element | Icon | Assessment |
|---------|------|------------|
| Farmer avatar | `person` | ⚠️ Generic - could be farmer icon |
| Search | `search` | ✅ Good |
| Filter | `filter_list` | ✅ Good |
| Sync | `sync` | ✅ Good |
| Cattle | `pets` | ⚠️ Generic - needs cow icon |
| Location | `place` | ✅ Good |
| Add | `add` | ✅ Good |
| Edit | `edit` | ✅ Good |
| Archive | `archive` | ✅ Good |
| Navigate | `chevron_right` | ✅ Good |
| Milk production | `water_drop` | ✅ Good |

**Recommendations:**
- Replace `person` with farmer-specific icon (e.g., `agriculture` or custom)
- Replace `pets` with cow-specific icon

---

### 8.7 Typography Review

**Current State:**
- Search placeholder: Quasar default
- Filter chips: Quasar q-chip default
- Farmer name: `q-item-label`
- Location: `q-item-label caption`
- Section headers: `text-subtitle2 text-weight-medium`
- Stat numbers: `text-h4 text-primary`
- Stat labels: `text-caption text-grey-7`
- Detail headers: `text-h5`

**Assessment:**
- ✅ Consistent with other modules
- ✅ Good hierarchy
- ✅ Appropriate use of captions for secondary info

---

### 8.8 Offline Support Review

**FarmerListPage:**
- ✅ Loads from IndexedDB if offline
- ✅ Shows sync status chip
- ✅ Pull-to-refresh syncs when online

**FarmerFormPage:**
- ✅ Creates locally first (optimistic)
- ✅ Queues for sync if offline
- ✅ Updates work offline
- ✅ Archive works offline

**FarmerDetailPage:**
- ✅ Loads farmer from local database first
- ⚠️ Summary statistics may not load offline (API call)
- ⚠️ Farmer's cows may not load offline (API call)

---

### 8.9 Actions Required

| Priority | Gap ID | Action |
|----------|--------|--------|
| **High** | H19 | Internationalize all text using `$t()` calls |
| **High** | H20 | Use i18n date formatting instead of hardcoded locale |
| **Medium** | M41 | Use farmer-specific icon instead of generic `person` |
| **Medium** | M42 | Make farming type options i18n translated |
| **Medium** | M43 | Add farmer photo upload feature |
| **Medium** | M44 | Replace `pets` icon with cow-specific icon |
| **Low** | L15 | Verify /yields routes exist or update quick actions |
| **Low** | L16 | Add bulk import feature for farmers (CSV/Excel) |

---

---

## Module 9: Yield History

**Review Date:** 2026-02-06
**Status:** ✅ Complete
**Gaps Found:** 8 (0 Critical, 2 High, 4 Medium, 2 Low)

### 9.1 Database Schema

**Tables:**
- `yield_data` - Milk yield collection records

**yield_data columns:**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| farmer_profile_id | UUID | FK to farmer_profiles (required) |
| cow_profile_id | UUID | FK to cow_profiles (optional) |
| diet_recommendation_id | UUID | FK to bot_diet_history (optional) |
| collection_date | DATE | Required |
| milk_yield_liters | DECIMAL(10,2) | Required |
| fat_percentage | DECIMAL(5,2) | Optional quality metric |
| snf_percentage | DECIMAL(5,2) | Optional quality metric |
| collected_by_user_id | UUID | FK to user_information |
| notes | TEXT | Optional observations |
| created_at | TIMESTAMP | Auto |

**Schema Assessment:**
- ✅ Good: Supports both farm-level and cow-level yield tracking
- ✅ Good: Links to diet recommendations for comparison
- ✅ Good: Includes SNF percentage (unlike milk_logs)
- ✅ Good: collected_by_user_id for extension worker attribution
- ⚠️ Note: This appears to be a separate yield tracking system from milk_logs

---

### 9.2 Backend API

**Endpoints:**
| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/v1/yield-data | List yield records (with filters) |
| POST | /api/v1/yield-data | Create yield record |
| GET | /api/v1/yield-data/{id} | Get record details |
| PUT | /api/v1/yield-data/{id} | Update record |
| DELETE | /api/v1/yield-data/{id} | Delete record |
| GET | /api/v1/yield-data/farmer/{id} | Get farmer's yield history |
| GET | /api/v1/yield-data/cow/{id} | Get cow's yield history |
| GET | /api/v1/yield-data/analytics/organization/{id} | Get org analytics |

**Query Parameters (GET /api/v1/yield-data):**
- `farmer_profile_id` - Filter by farmer
- `cow_profile_id` - Filter by cow
- `date_from` - Filter from date
- `date_to` - Filter to date
- `collected_by_user_id` - Filter by collector

**Analytics Response:**
```json
{
  "total_records": 150,
  "avg_milk_yield": 12.5,
  "avg_fat_percentage": 4.2,
  "avg_snf_percentage": 8.5,
  "total_farmers": 25,
  "date_range_start": "2026-01-01",
  "date_range_end": "2026-02-06"
}
```

**API Assessment:**
- ✅ Good: Full CRUD operations
- ✅ Good: Specialized endpoints for farmer and cow history
- ✅ Good: Organization analytics endpoint
- ✅ Good: Date range filtering
- ⚠️ Note: Separate from milk_logs API (potential duplication)

---

### 9.3 Frontend Implementation

**Pages:**
| Page | Route | Purpose |
|------|-------|---------|
| YieldHistoryPage | /yields | List yield records with filters |
| YieldFormPage | /yields/new | Record new yield |

**YieldHistoryPage Features:**
- ✅ Farmer filter dropdown
- ✅ Date range filter dialog
- ✅ Summary card (Records, Avg Yield, Avg Fat)
- ✅ Pull-to-refresh
- ✅ Skeleton loading
- ✅ Sync status indicator (Pending chip)
- ✅ FAB for new yield
- ✅ Empty state with action
- ⚠️ All text hardcoded English
- ⚠️ Date formatting uses hardcoded 'en-US' locale
- ⚠️ No charts/visualizations
- ⚠️ No edit option for existing records

**YieldFormPage Features:**
- ✅ Farmer selection (required)
- ✅ Cow selection (optional, loads based on farmer)
- ✅ Collection date picker (defaults to today)
- ✅ Milk yield input with validation
- ✅ Fat and SNF percentage inputs
- ✅ Notes field
- ✅ Success notification with Quasar $q.notify
- ✅ Pre-fills farmer/cow from query params
- ⚠️ Generic 'person' icon for farmer
- ⚠️ Generic 'pets' icon for cow
- ⚠️ All text hardcoded English
- ⚠️ Validation messages hardcoded

---

### 9.4 Store Analysis (yields.ts)

**State:**
- `yieldRecords` - Array of yield records
- `analytics` - Organization analytics data
- `loading` - Loading state
- `error` - Error message

**Computed:**
- `yieldCount` - Total yield count
- `recentYields` - Last 10 yields sorted by date
- `averageMilkYield` - Average across all records

**Actions:**
- ✅ `fetchYieldHistory(options)` - With IndexedDB caching
- ✅ `fetchFarmerYieldHistory(farmerId)` - Farmer-specific fetch
- ✅ `fetchCowYieldHistory(cowId)` - Cow-specific fetch
- ✅ `recordYield(input)` - Optimistic with sync queue
- ✅ `updateYield(id, input)` - Optimistic with sync queue
- ✅ `deleteYield(id)` - With sync queue
- ✅ `fetchOrganizationAnalytics(orgId)` - Analytics fetch
- ✅ `loadFromCache(farmerProfileId)` - Initialize from IndexedDB

**Offline Support Assessment:**
- ✅ Excellent: Optimistic creates/updates/deletes
- ✅ Excellent: IndexedDB caching via Dexie
- ✅ Excellent: Sync queue for offline changes
- ✅ Good: Farmer and cow-specific caching
- ⚠️ Note: Store supports update but UI doesn't expose it

---

### 9.5 UI/UX Review

**Current Design (YieldHistoryPage):**
```
┌─────────────────────────────────────┐
│  [Filter by Farmer    ▼]       [📅] │
│                                     │
│  ┌─── Jan 15 - Feb 6 ────┐         │
│  │          ×            │         │
│  └───────────────────────┘         │
│                                     │
│  ┌─────────────────────────────────┐│
│  │  150      │  12.5    │  4.2%   ││
│  │ Records   │ Avg L/day│ Avg Fat ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ 💧 Feb 6, 2026         [Pending]││
│  │    15.2L · Fat: 4.5% · SNF: 8.7%││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │ 💧 Feb 5, 2026                  ││
│  │    14.8L · Fat: 4.3% · SNF: 8.5%││
│  └─────────────────────────────────┘│
│                           ┌───┐    │
│                           │📈│    │
│                           └───┘    │
└─────────────────────────────────────┘
```

**Issues Identified:**

**⚠️ GAP H21: No Internationalization**
- "Filter by Farmer" - hardcoded English
- "No Yield Records" - hardcoded
- "Start recording milk yields..." - hardcoded
- "Record Yield" button - hardcoded
- "Records", "Avg L/day", "Avg Fat" - hardcoded
- "Filter by Date", "From", "To" - hardcoded
- All form labels, hints, validation messages - hardcoded
- Should use `$t()` for all user-visible text

**⚠️ GAP H22: Hardcoded Date Locale**
- `new Date(dateString).toLocaleDateString('en-US', {...})`
- Hardcodes 'en-US' locale
- Should use user's locale or i18n date formatting

**⚠️ GAP M45: Generic Person Icon**
- Uses `person` icon for farmer selection
- Should use farmer/agriculture icon

**⚠️ GAP M46: Generic Cow Icon**
- Uses `pets` icon for cow selection
- Should use cow-specific icon

**⚠️ GAP M47: No Data Visualization**
- List view only, no charts
- Would benefit from yield trend chart
- No visual comparison over time
- Extension workers need quick insights

**⚠️ GAP M48: No Edit for Yields**
- Store has `updateYield` function
- UI only has record (create) functionality
- List items are clickable but don't navigate to edit
- Users cannot correct mistakes

---

### 9.6 Iconography Review

**Current Icons:**
| Element | Icon | Assessment |
|---------|------|------------|
| Farmer avatar | `person` | ⚠️ Generic - needs farmer icon |
| Cow avatar | `pets` | ⚠️ Generic - needs cow icon |
| Yield avatar | `water_drop` | ✅ Good |
| Add FAB | `add_chart` | ✅ Good - suggests data recording |
| Date filter | `date_range` | ✅ Good |
| Empty state | `analytics` | ✅ Good |
| Sync | `sync` | ✅ Good |

**Recommendations:**
- Replace `person` with farmer-specific icon
- Replace `pets` with cow-specific icon

---

### 9.7 Typography Review

**Current State:**
- Summary stats: `text-h5` on colored background
- Summary labels: `text-caption`
- Record date: `q-item-label`
- Yield details: `q-item-label caption`
- Filter labels: Quasar default
- Dialog titles: `text-h6`

**Assessment:**
- ✅ Good hierarchy
- ✅ Consistent with other modules
- ✅ Good use of summary card for key metrics

---

### 9.8 Offline Support Review

**YieldHistoryPage:**
- ✅ Loads from IndexedDB if offline
- ✅ Shows sync status chip
- ✅ Pull-to-refresh syncs when online
- ✅ Farmer-specific caching

**YieldFormPage:**
- ✅ Creates locally first (optimistic)
- ✅ Queues for sync if offline
- ⚠️ Farmer and cow options require online fetch initially

---

### 9.9 Relationship to Milk Logging Module

**Note:** There appear to be two overlapping systems:
1. **milk_logs** (Module 6) - Personal milk tracking with morning/evening split
2. **yield_data** (Module 9) - Extension worker yield collection with farmer attribution

**Differences:**
- milk_logs: tied to user_id, morning/evening split
- yield_data: tied to farmer_profile_id, collected_by_user_id, SNF tracking

**Recommendation:** Consider whether these should be unified or clearly differentiated in the UI.

---

### 9.10 Actions Required

| Priority | Gap ID | Action |
|----------|--------|--------|
| **High** | H21 | Internationalize all text using `$t()` calls |
| **High** | H22 | Use i18n date formatting instead of hardcoded locale |
| **Medium** | M45 | Use farmer-specific icon instead of generic `person` |
| **Medium** | M46 | Replace `pets` icon with cow-specific icon |
| **Medium** | M47 | Add yield trend chart/visualization |
| **Medium** | M48 | Add edit page/functionality for yield records |
| **Low** | L17 | Add farmer yield comparison view |
| **Low** | L18 | Add export functionality (CSV/PDF) |

---

---

## Module 10: Reports

**Review Date:** 2026-02-06
**Status:** ✅ Complete
**Gaps Found:** 8 (0 Critical, 2 High, 4 Medium, 2 Low)

### 10.1 Database Schema

**Tables:**
- `reports` - Generated report records (stored in IndexedDB for caching)

**reports columns (IndexedDB):**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| title | STRING | Report title |
| report_type | STRING | milk_production, feed_consumption, cow_performance, cost_analysis |
| status | STRING | pending, completed, failed |
| parameters | OBJECT | JSON with cow_id, start_date, end_date |
| file_url | STRING | URL to download PDF |
| created_at | TIMESTAMP | When generated |
| _cached_at | TIMESTAMP | When cached locally |

**Schema Assessment:**
- ✅ Good: Simple report tracking structure
- ✅ Good: Flexible parameters object
- ✅ Good: Status tracking for async generation
- ⚠️ Note: Reports stored in backend, cached locally
- ⚠️ Missing: Organization/farmer scoping
- ⚠️ Missing: Report file content (only URL)

---

### 10.2 Backend API

**Endpoints:**
| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/v1/reports | List user's reports |
| POST | /api/v1/reports/generate | Generate new report |
| GET | /api/v1/reports/{id} | Get report details |

**Generate Request:**
```json
{
  "report_type": "milk_production|feed_consumption|cow_performance|cost_analysis",
  "parameters": {
    "cow_id": "uuid (optional)",
    "start_date": "yyyy-MM-dd",
    "end_date": "yyyy-MM-dd"
  }
}
```

**API Assessment:**
- ✅ Good: Async report generation
- ✅ Good: Date range filtering
- ✅ Good: Cow-specific filtering
- ⚠️ Missing: Organization/farmer scope for extension workers
- ⚠️ Missing: Export format options (only PDF)
- ⚠️ Missing: Report scheduling/recurrence

---

### 10.3 Frontend Implementation

**Pages:**
| Page | Route | Purpose |
|------|-------|---------|
| ReportListPage | /reports | Generate and list reports |
| ReportDetailPage | /reports/:id | View report details and download |

**ReportListPage Features:**
- ✅ Report type cards with icons
- ✅ Recent reports list
- ✅ Status badges (completed, pending)
- ✅ Generate dialog with parameters
- ✅ Date range pickers
- ✅ Cow selection for cow_performance
- ✅ Skeleton loading
- ✅ Empty state
- ✅ Success notifications
- ⚠️ All text hardcoded English
- ⚠️ Uses generic 'pets' icon for cow_performance
- ⚠️ Report generation requires online

**ReportDetailPage Features:**
- ✅ Report title and timestamp
- ✅ Download PDF button
- ✅ Parameters display
- ✅ Not found empty state
- ✅ Caches report on view
- ⚠️ All text hardcoded English
- ⚠️ No actual PDF preview (just placeholder)
- ⚠️ Date format not localized

**Report Types:**
1. **Milk Production** - `water_drop` icon, primary color
2. **Feed Consumption** - `grass` icon, secondary color
3. **Cow Performance** - `pets` icon (⚠️ generic), accent color
4. **Cost Analysis** - `savings` icon, positive color

---

### 10.4 Store Analysis

**No Dedicated Store**
- Reports module uses API calls directly
- Caches to IndexedDB via `db.reports`
- State managed locally with `ref()`

**Local State:**
- `reports` - Array of report objects
- `loading` - Loading state
- `generating` - Generation in progress
- `selectedReportType` - Current report type being generated

**Caching Strategy:**
- Reports fetched from API
- Cached to IndexedDB with `_cached_at` timestamp
- Fallback to cache if API fails
- Individual reports cached on view

---

### 10.5 UI/UX Review

**Current Design (ReportListPage):**
```
┌─────────────────────────────────────┐
│  Generate Report                    │
│  ┌────────┐  ┌────────┐            │
│  │   💧   │  │   🌿   │            │
│  │  Milk  │  │  Feed  │            │
│  │Produc- │  │Consump-│            │
│  │  tion  │  │  tion  │            │
│  └────────┘  └────────┘            │
│  ┌────────┐  ┌────────┐            │
│  │   🐾   │  │   💰   │            │
│  │  Cow   │  │  Cost  │            │
│  │Perform-│  │Analysis│            │
│  │  ance  │  │        │            │
│  └────────┘  └────────┘            │
│                                     │
│  Recent Reports                     │
│  ┌─────────────────────────────┐   │
│  │ 💧 Milk Production Report   │   │
│  │    Feb 6, 2026  [completed] │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 💰 Cost Analysis Report     │   │
│  │    Feb 5, 2026  [pending]   │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Issues Identified:**

**⚠️ GAP H23: No Internationalization**
- "Generate Report" - hardcoded English
- "Milk Production", "Feed Consumption", etc. - hardcoded
- "Recent Reports", "No reports generated yet" - hardcoded
- "Start Date", "End Date", "Select Cow" - hardcoded
- "Generate", "Cancel", "Download PDF" - hardcoded
- "Report Parameters", "Report Type", "Date Range" - hardcoded
- Should use `$t()` for all user-visible text

**⚠️ GAP H24: Generic Cow Icon**
- Uses `pets` icon for Cow Performance report
- Should use cow-specific icon to match other modules

**⚠️ GAP M49: No Offline Generation**
- Report generation requires internet connection
- No queuing for later generation
- Viewing cached reports works offline

**⚠️ GAP M50: Date Format Not Localized**
- Uses `format(new Date(dateStr), 'MMM d, yyyy h:mm a')`
- English month abbreviations hardcoded
- Should use localized date formatting

**⚠️ GAP M51: No Report Scheduling**
- Must manually generate each report
- No recurring reports (daily, weekly, monthly)
- Extension workers may want automated reports

**⚠️ GAP M52: No PDF Preview**
- Report detail shows placeholder "PDF Report Ready"
- Must download PDF to view content
- Could show inline preview or summary

---

### 10.6 Iconography Review

**Current Icons:**
| Element | Icon | Assessment |
|---------|------|------------|
| Milk Production | `water_drop` | ✅ Good |
| Feed Consumption | `grass` | ✅ Good |
| Cow Performance | `pets` | ⚠️ Generic - needs cow icon |
| Cost Analysis | `savings` | ✅ Good |
| Download | `download` | ✅ Good |
| PDF | `picture_as_pdf` | ✅ Good |
| Date | `event` | ✅ Good |
| Empty state | `assessment` | ✅ Good |
| Error | `error_outline` | ✅ Good |

**Recommendations:**
- Replace `pets` with cow-specific icon for cow_performance report

---

### 10.7 Typography Review

**Current State:**
- Section headers: `text-subtitle1`
- Report type labels: `text-body2`
- Report title: `text-h6`
- Timestamps: `text-caption text-grey-7`
- Parameter labels: `q-item-label caption`
- Parameter values: `q-item-label`

**Assessment:**
- ✅ Consistent with other modules
- ✅ Good hierarchy
- ✅ Appropriate status badge styling

---

### 10.8 Offline Support Review

**ReportListPage:**
- ✅ List loads from cache if API fails
- ⚠️ Report generation requires internet
- ⚠️ No generation queue for offline

**ReportDetailPage:**
- ✅ Report details load from cache
- ⚠️ PDF download requires internet
- ⚠️ No offline file storage

**Limitations:**
- Reports are generated server-side (PDF creation)
- Cannot generate reports offline
- Cached reports viewable but not downloadable offline

---

### 10.9 Actions Required

| Priority | Gap ID | Action |
|----------|--------|--------|
| **High** | H23 | Internationalize all text using `$t()` calls |
| **High** | H24 | Replace `pets` icon with cow-specific icon |
| **Medium** | M49 | Add report generation queue for offline |
| **Medium** | M50 | Use i18n date formatting |
| **Medium** | M51 | Add report scheduling feature |
| **Medium** | M52 | Add inline PDF preview or summary |
| **Low** | L19 | Add report sharing (email, WhatsApp) |
| **Low** | L20 | Add custom report templates |

---

---

## Module 11: Settings & Profile

**Review Date:** 2026-02-06
**Status:** ✅ Complete
**Gaps Found:** 8 (0 Critical, 2 High, 4 Medium, 2 Low)

### 11.1 Database Schema

**Tables Used:**
- `user_information` - User profile data (shared with Auth module)
- `country` - Country reference data
- `organization` - Organization reference data

**User Profile Fields (editable via Settings):**
| Field | Type | Editable | Notes |
|-------|------|----------|-------|
| name | VARCHAR(100) | ✅ Yes | Required |
| email_id | VARCHAR(255) | ❌ No | Contact support only |
| phone_number | VARCHAR(20) | ❌ No | Contact support only |
| country_id | UUID | ✅ Yes | FK to country |
| language_code | VARCHAR(10) | ✅ Yes | User's preferred language |
| daily_reminder_enabled | BOOLEAN | ✅ Yes | Notification preference |
| follow_up_reminder_enabled | BOOLEAN | ✅ Yes | Notification preference |
| organization_id | UUID | ❌ No | Contact support to change |

**Schema Assessment:**
- ✅ Good: Core profile fields present
- ⚠️ Missing: No profile_image_url field for avatar
- ⚠️ Issue: Email/phone not editable by user

---

### 11.2 Backend API

**Endpoints:**
| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/v1/auth/settings | Get user settings |
| PUT | /api/v1/auth/settings | Update user settings |
| PUT | /api/v1/auth/change-pin | Change user PIN |
| GET | /auth/countries | List available countries |
| GET | /auth/languages | List available languages |

**Settings Update Fields:**
- `name` - User's display name
- `country_id` - Selected country UUID
- `language_code` - Selected language code
- `daily_reminder_enabled` - Boolean
- `follow_up_reminder_enabled` - Boolean

**API Assessment:**
- ✅ Good: Proper separation of settings from auth
- ✅ Good: PIN change is separate endpoint
- ⚠️ Note: Countries/languages endpoint exists but frontend hardcodes options

---

### 11.3 Frontend Implementation

**Pages:**
| Page | Route | Purpose |
|------|-------|---------|
| SettingsPage | /settings | App settings and preferences |
| ProfilePage | /settings/profile | Edit user profile |

**SettingsPage Features:**
- ✅ Language selection from dropdown
- ✅ Role display (not editable)
- ✅ Organization display (not editable)
- ✅ Notification toggles (daily/follow-up reminders)
- ✅ PWA install prompt button
- ✅ Manual sync button
- ✅ Clear cache button
- ✅ About section (version, help, privacy)
- ✅ Uses i18n `$t()` for most labels
- ⚠️ formatOrgType() has hardcoded English labels

**ProfilePage Features:**
- ✅ Name editing
- ✅ Email display (non-editable with explanation)
- ✅ Phone display (non-editable with explanation)
- ✅ Country selection dropdown
- ✅ Language selection dropdown
- ✅ Change PIN functionality (old PIN, new PIN, confirm)
- ✅ Save button with loading state
- ⚠️ ALL text hardcoded English (not i18n)
- ⚠️ Country options hardcoded (not from API)
- ⚠️ Language options hardcoded (not from API)

**Hardcoded Country Options (ProfilePage):**
```typescript
const countryOptions = [
  { label: 'India', value: 'IN' },
  { label: 'Kenya', value: 'KE' },
  { label: 'Ethiopia', value: 'ET' },
  { label: 'Nepal', value: 'NP' },
  { label: 'Bangladesh', value: 'BD' },
];
```

**Hardcoded Language Options (ProfilePage):**
```typescript
const languageOptions = [
  { label: 'English', value: 'en' },
  { label: 'Hindi', value: 'hi' },
  { label: 'Bengali', value: 'bn' },
  { label: 'Telugu', value: 'te' },
  { label: 'Marathi', value: 'mr' },
  { label: 'Kannada', value: 'kn' },
];
```

---

### 11.4 Store Analysis

**No Dedicated Settings Store**
- Settings managed via authStore
- Uses local component state for form
- Directly calls API endpoints

**authStore Settings Fields:**
- `user.name` - User's name
- `user.country_id` - User's country
- `user.language_code` - User's language
- `userRole` - User's role (readonly)
- `userOrganization` - User's organization (readonly)

**Data Flow:**
1. ProfilePage loads from authStore.user
2. User edits form fields locally
3. On save, calls authStore.updateSettings()
4. authStore calls API and updates local state

---

### 11.5 UI/UX Review

**Current Design (SettingsPage):**
```
┌─────────────────────────────────────┐
│  Settings                           │
│  ┌─────────────────────────────┐   │
│  │ 👤 Profile                  →│   │
│  │    Edit your profile         │   │
│  └─────────────────────────────┘   │
│                                     │
│  Preferences                        │
│  ┌─────────────────────────────┐   │
│  │ 🌐 Language      [English ▼]│   │
│  │ 🎭 Role              Farmer │   │
│  │ 🏢 Organization    [None]   │   │
│  └─────────────────────────────┘   │
│                                     │
│  Notifications                      │
│  ┌─────────────────────────────┐   │
│  │ 📅 Daily Reminder       [●] │   │
│  │ 🔔 Follow-up Reminder   [○] │   │
│  └─────────────────────────────┘   │
│                                     │
│  App                                │
│  ┌─────────────────────────────┐   │
│  │ 📲 Install App              │   │
│  └─────────────────────────────┘   │
│                                     │
│  Data & Sync                        │
│  ┌─────────────────────────────┐   │
│  │ 🔄 Sync Now                 │   │
│  │ 🗑️ Clear Cache              │   │
│  └─────────────────────────────┘   │
│                                     │
│  About                              │
│  ┌─────────────────────────────┐   │
│  │ Version 1.0.0               │   │
│  │ Help & Support              │   │
│  │ Privacy Policy              │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Current Design (ProfilePage):**
```
┌─────────────────────────────────────┐
│  Edit Profile                       │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 👤                          │   │
│  │ [Generic Avatar]            │   │
│  └─────────────────────────────┘   │
│                                     │
│  Name                               │
│  ┌─────────────────────────────┐   │
│  │ John Doe                    │   │
│  └─────────────────────────────┘   │
│                                     │
│  Email (cannot be changed)          │
│  ┌─────────────────────────────┐   │
│  │ john@example.com       [🔒] │   │
│  └─────────────────────────────┘   │
│                                     │
│  Phone (contact support to change)  │
│  ┌─────────────────────────────┐   │
│  │ +91 9876543210         [🔒] │   │
│  └─────────────────────────────┘   │
│                                     │
│  Country                            │
│  ┌─────────────────────────────┐   │
│  │ India                    ▼  │   │
│  └─────────────────────────────┘   │
│                                     │
│  Language                           │
│  ┌─────────────────────────────┐   │
│  │ English                  ▼  │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │       Save Changes         │   │
│  └─────────────────────────────┘   │
│                                     │
│  Security                           │
│  ┌─────────────────────────────┐   │
│  │ Change PIN                 →│   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Issues Identified:**

**⚠️ GAP H25: ProfilePage No Internationalization**
- "Edit Profile", "Name", "Email", "Phone" - hardcoded English
- "cannot be changed", "contact support to change" - hardcoded
- "Country", "Language", "Save Changes" - hardcoded
- "Security", "Change PIN" - hardcoded
- All validation messages hardcoded
- SettingsPage uses i18n but ProfilePage does not (inconsistent)

**⚠️ GAP H26: Hardcoded Options Lists**
- Country options hardcoded (5 countries)
- Language options hardcoded (6 languages)
- Backend has API endpoints for these
- New countries/languages require code change

**⚠️ GAP M53: Generic User Avatar**
- Uses generic 'person' Material icon
- No visual personalization
- All users look the same

**⚠️ GAP M54: No Profile Photo**
- No avatar/photo upload capability
- Database lacks profile_image_url field
- Would help identify users (especially for extension workers)

**⚠️ GAP M55: Hardcoded Organization Types**
- formatOrgType() in SettingsPage has hardcoded labels
- 'university' → 'University', 'government' → 'Government', etc.
- Should use i18n for organization type labels

**⚠️ GAP M56: Locked Email/Phone**
- Email and phone cannot be edited
- Shows "cannot be changed" / "contact support"
- May frustrate users who entered wrong info
- Consider allowing change with re-verification

---

### 11.6 Iconography Review

**Current Icons:**
| Element | Icon | Assessment |
|---------|------|------------|
| Profile | `person` | ⚠️ Generic - no avatar |
| Language | `language` | ✅ Good |
| Role | `badge` | ✅ Good |
| Organization | `business` | ✅ Good |
| Daily reminder | `event` | ✅ Good |
| Follow-up reminder | `notifications` | ✅ Good |
| Install app | `install_mobile` | ✅ Good |
| Sync | `sync` | ✅ Good |
| Clear cache | `delete_sweep` | ✅ Good |
| Help | `help` | ✅ Good |
| Privacy | `privacy_tip` | ✅ Good |
| Lock (readonly) | `lock` | ✅ Good |
| Security | `security` | ✅ Good |

**Recommendations:**
- Allow profile photo upload as avatar
- Consider using country flags instead of generic dropdown

---

### 11.7 Typography Review

**Current State:**
- Page title: `text-h6` in q-toolbar
- Section headers: `text-subtitle2 text-grey-7`
- Setting labels: `q-item-label`
- Setting captions: `q-item-label caption`
- Input labels: Quasar default
- Button text: Quasar default

**Assessment:**
- ✅ Consistent with other modules
- ✅ Good visual hierarchy
- ✅ Appropriate use of grey for secondary text

---

### 11.8 Offline Support Review

**SettingsPage:**
- ⚠️ Settings changes require online
- ⚠️ No offline queue for settings updates
- ✅ Current settings cached in authStore

**ProfilePage:**
- ⚠️ Profile edits require online
- ⚠️ No offline queue for profile updates
- ⚠️ PIN change requires online

**Sync & Cache Features:**
- ✅ Manual sync button triggers full sync
- ✅ Clear cache button clears IndexedDB
- ✅ Good user control over offline data

**Limitations:**
- Settings changes not queued for later sync
- PIN change must be online (security requirement - OK)

---

### 11.9 Actions Required

| Priority | Gap ID | Action |
|----------|--------|--------|
| **High** | H25 | Internationalize ProfilePage using `$t()` calls |
| **High** | H26 | Fetch country/language options from API |
| **Medium** | M53 | Add profile photo/avatar support |
| **Medium** | M54 | Add profile_image_url to database and API |
| **Medium** | M55 | Use i18n for organization type labels |
| **Medium** | M56 | Consider allowing email/phone change with verification |
| **Low** | L21 | Implement Help & Support page/flow |
| **Low** | L22 | Add Privacy Policy page content |

---

_Next: Module 12 - Offline & Sync_

