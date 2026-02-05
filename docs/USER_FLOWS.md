# RationSmart PWA - User Flows & Persona Guide

## Overview

RationSmart PWA is a Progressive Web App for cattle nutrition optimization. It supports multiple user personas with role-based functionality.

---

## 1. User Personas & Roles

| Role | Description | Primary Actions | Access Level |
|------|-------------|-----------------|--------------|
| **Farmer** | Individual cattle owner managing their own animals | Manage own cows, log milk, get diet recommendations | Own data only |
| **Student** | Agriculture/veterinary student learning the system | Same as Farmer, plus access to learning resources | Own data only |
| **Nutritionist** | Animal nutrition expert providing recommendations | View farmers' data, provide diet advice, access analytics | Organization-wide |
| **Extension Worker** | Field worker managing multiple farmers | Create farmer profiles, collect yield data, generate reports | Organization-wide |
| **Researcher** | Research institution staff analyzing data | Access aggregated analytics, export data, run experiments | Organization-wide + Analytics |

---

## 2. First-Time User Flow (New Registration)

### Step-by-Step Flow

| Step | Screen | URL | User Action | What Happens |
|------|--------|-----|-------------|--------------|
| 1 | Landing | `/auth/login` | Taps "Register" | Redirects to registration |
| 2 | Register | `/auth/register` | Enters email/phone + creates 4-digit PIN + selects country | Account created, auto-logged in |
| 3 | Language | `/auth/language` | Selects preferred language from 22 options | UI language changes, preference saved |
| 4 | Role | `/auth/role` | Selects their role (Farmer, Student, etc.) | Role saved to profile |
| 5 | Organization | `/auth/organization` | Selects organization OR "Not Affiliated" | Links user to org (optional) |
| 6 | Profile Setup | `/auth/profile-setup` | Enters name, village, district, state | Self farmer profile created |
| 7 | Home | `/` | Onboarding complete! | Dashboard with quick actions |

### Supported Languages (22 total)

| Region | Languages |
|--------|-----------|
| Global | English |
| India | Hindi, Bengali, Telugu, Marathi, Tamil, Gujarati, Kannada, Malayalam, Odia, Punjabi, Assamese, Urdu |
| Nepal | Nepali |
| Vietnam | Vietnamese |
| Ethiopia | Amharic, Oromo |
| Indonesia | Indonesian |
| Philippines | Filipino |
| Thailand | Thai |
| Morocco | Arabic, French |

---

## 3. Returning User Flow (Login)

| Step | Screen | URL | User Action | What Happens |
|------|--------|-----|-------------|--------------|
| 1 | Login | `/auth/login` | Enters email/phone + 4-digit PIN | Credentials verified |
| 2a | Home | `/` | If onboarding complete | Dashboard shown |
| 2b | Language | `/auth/language` | If onboarding incomplete | Continues onboarding flow |

---

## 4. Main App Navigation

### Bottom Navigation (Mobile - 5 tabs)

| Tab | Icon | Screen | URL | Purpose |
|-----|------|--------|-----|---------|
| Home | 🏠 | Dashboard | `/` | Quick stats, recent activity, shortcuts |
| Farmers | 👥 | Farmer List | `/farmers` | Manage farmer profiles (Extension Worker) |
| Cows | 🐄 | Cow List | `/cows` | Manage cattle profiles |
| Diet | 🍽️ | Diet List | `/diet` | View diet recommendations |
| More | ⚙️ | Settings | `/settings` | App settings, profile, logout |

### Side Drawer (Tablet/Desktop - Full Menu)

| Menu Item | Icon | URL | Purpose |
|-----------|------|-----|---------|
| Home | home | `/` | Dashboard |
| Farmers | people | `/farmers` | Farmer management |
| My Cows | pets | `/cows` | Cattle management |
| Diet Plans | restaurant | `/diet` | Diet recommendations |
| Feeds | grass | `/feeds` | Feed catalog |
| Milk Logs | water_drop | `/logs` | Daily milk logging |
| Yield History | analytics | `/yields` | Historical yield data |
| Reports | assessment | `/reports` | Generate reports |
| Settings | settings | `/settings` | App settings |

---

## 5. Feature Access by Role

| Feature | Farmer | Student | Nutritionist | Extension Worker | Researcher |
|---------|--------|---------|--------------|------------------|------------|
| **Own Cow Management** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Milk Logging** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Get Diet Recommendations** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Custom Feeds** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **View Own Reports** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Farmer Profile CRUD** | ❌ | ❌ | 👁️ View | ✅ Create/Edit | 👁️ View |
| **Yield Data Collection** | ❌ | ❌ | 👁️ View | ✅ Collect | ✅ |
| **Organization Analytics** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Export Data** | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## 6. Core User Journeys

### A. Adding a Cow

| Step | Action | URL |
|------|--------|-----|
| 1 | Tap FAB (+) → "Add Cow" OR navigate to Cows → (+) | `/cows/new` |
| 2 | Fill cow details: name, breed, weight, milk yield, lactation stage | - |
| 3 | Set optional: pregnancy status, body condition score, notes | - |
| 4 | Tap "Save" | Redirects to `/cows` |

### B. Getting Diet Recommendation

| Step | Action | URL |
|------|--------|-----|
| 1 | Tap FAB (+) → "Get Diet" OR Diet → New | `/diet/new` |
| 2 | Step 1: Select cow (or enter details manually) | - |
| 3 | Step 2: Select available feeds from catalog | - |
| 4 | Step 3: Choose optimization goal (min cost / max milk) | - |
| 5 | Tap "Optimize Diet" | - |
| 6 | View results: ingredient amounts, costs, nutrition summary | `/diet/:id` |

### C. Logging Daily Milk

| Step | Action | URL |
|------|--------|-----|
| 1 | Tap FAB (+) → "Log Milk" OR Logs → (+) | `/logs/new` |
| 2 | Select cow, enter morning/evening milk amounts | - |
| 3 | Optional: fat percentage, notes | - |
| 4 | Tap "Save" | Redirects to `/logs` |

### D. Managing Farmers (Extension Worker Only)

| Step | Action | URL |
|------|--------|-----|
| 1 | Navigate to Farmers → (+) | `/farmers/new` |
| 2 | Enter farmer details: name, phone, village, district | - |
| 3 | Tap "Save" | Redirects to `/farmers` |
| 4 | Tap farmer → View profile, add cows, record yields | `/farmers/:id` |

---

## 7. Settings & Preferences

### Settings Page (`/settings`)

| Setting | Location | Description |
|---------|----------|-------------|
| **Profile** | Settings → Profile | Edit name, contact info |
| **Language** | Settings → Language | Change app language (22 options) |
| **Role** | Settings → Role | Change user role |
| **Organization** | Settings → Organization | Join/leave organization |
| **Push Notifications** | Settings → Toggle | Enable/disable notifications |
| **Install App** | Settings → Install | Add to home screen (A2HS) |
| **Sync Status** | Settings → Data & Sync | View offline queue, manual sync |
| **Clear Data** | Settings → Clear Data | Clear local cache |
| **Logout** | Settings → Logout | Sign out |

### Language Change Flow

| Step | Action | Result |
|------|--------|--------|
| 1 | Settings → Language | Opens language dialog |
| 2 | Select language | UI immediately switches |
| 3 | Preference saved | Synced to server when online |

---

## 8. Offline Behavior

| Scenario | Behavior |
|----------|----------|
| **No internet on launch** | App loads from cache, shows offline indicator |
| **Create cow while offline** | Saved locally, queued for sync |
| **Log milk while offline** | Saved locally, syncs when online |
| **Get diet while offline** | Uses cached feeds, optimization runs locally if possible |
| **View data while offline** | All previously viewed data available |
| **Back online** | Auto-syncs queued changes, shows sync status |

---

## 9. Admin/Organization Capabilities

> **Note**: Full admin panel is typically separate from the PWA. PWA provides field-level features.

### Extension Worker Capabilities (via PWA)

| Capability | Description |
|------------|-------------|
| Create farmer profiles | Add new farmers to organization |
| Manage farmer cows | Add/edit cows for farmers |
| Collect yield data | Record daily milk yields from farmers |
| View farmer summary | See individual farmer metrics |
| Generate reports | Download farmer-level reports |

### Backend Admin Capabilities (via API/separate admin panel)

| Capability | Endpoint |
|------------|----------|
| Manage organizations | `/organizations/` |
| Manage breeds | `/breeds/` |
| Manage master feeds | `/feeds/` |
| View analytics | `/yield-data/analytics/` |
| Bulk data export | `/reports/export/` |

---

## 10. URL Route Reference

### Auth Routes (Public)

| Route | Page | Description |
|-------|------|-------------|
| `/auth/login` | LoginPage | Email/phone + PIN login |
| `/auth/register` | RegisterPage | New user registration |
| `/auth/country` | CountrySelectPage | Country selection (registration) |

### Onboarding Routes (Authenticated, One-time)

| Route | Page | Description |
|-------|------|-------------|
| `/auth/language` | LanguageSelectPage | Language selection |
| `/auth/role` | RoleSelectPage | Role selection |
| `/auth/organization` | OrgSelectPage | Organization selection |
| `/auth/profile-setup` | MyProfileSetupPage | Profile completion |

### Main App Routes (Authenticated)

| Route | Page | Description |
|-------|------|-------------|
| `/` | HomePage | Dashboard |
| `/cows` | CowListPage | List all cows |
| `/cows/new` | CowFormPage | Add new cow |
| `/cows/:id` | CowDetailPage | View cow details |
| `/cows/:id/edit` | CowFormPage | Edit cow |
| `/diet` | DietListPage | List diet recommendations |
| `/diet/new` | DietWizardPage | Create diet plan |
| `/diet/:id` | DietDetailPage | View diet details |
| `/feeds` | FeedListPage | Feed catalog |
| `/feeds/new` | FeedFormPage | Add custom feed |
| `/feeds/:id` | FeedDetailPage | View feed details |
| `/logs` | LogListPage | Milk log history |
| `/logs/new` | LogFormPage | Add milk log |
| `/farmers` | FarmerListPage | List farmers |
| `/farmers/new` | FarmerFormPage | Add farmer |
| `/farmers/:id` | FarmerDetailPage | View farmer |
| `/yields` | YieldHistoryPage | Yield history |
| `/yields/new` | YieldFormPage | Record yield |
| `/reports` | ReportListPage | Reports list |
| `/reports/:id` | ReportDetailPage | View report |
| `/settings` | SettingsPage | App settings |
| `/settings/profile` | ProfilePage | Edit profile |

---

## 11. Quick Reference Card

### First Visit
1. Open app URL → Login page
2. Tap "Register" → Enter email + PIN + country
3. Complete onboarding: Language → Role → Organization → Profile
4. Dashboard ready!

### Daily Use
1. Login with email/phone + PIN
2. Use bottom tabs or drawer to navigate
3. FAB (+) for quick actions: Add Cow, Log Milk, Get Diet
4. Works offline - syncs automatically when online

### Change Settings
- Settings → Language (change anytime)
- Settings → Role (change anytime)
- Settings → Organization (change anytime)
- Settings → Logout (signs out, clears local data)
