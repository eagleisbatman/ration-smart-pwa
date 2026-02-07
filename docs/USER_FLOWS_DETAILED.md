# RationSmart PWA - Detailed User Flows

This document explains **exactly** what happens at each step when a user interacts with the app. Written for anyone to understand - no technical background required.

---

## Table of Contents

### Authentication & Setup
1. [New User Registration Flow](#1-new-user-registration-flow)
2. [Returning User Login Flow](#2-returning-user-login-flow)
3. [Onboarding Flow (After Registration)](#3-onboarding-flow-after-registration)
4. [Profile Setup Details](#4-profile-setup-details)
5. [What Gets Saved & Where](#5-what-gets-saved--where)

### Core Features
6. [Home Dashboard](#6-home-dashboard)
7. [Cow Management](#7-cow-management)
8. [Diet Optimization](#8-diet-optimization)
9. [Milk Logging](#9-milk-logging)
10. [Feed Management](#10-feed-management)

### Extension Worker Features
11. [Extension Worker Dashboard](#11-extension-worker-dashboard)
12. [Farmer Management](#12-farmer-management)
13. [Yield History](#13-yield-history)

### Reports & Settings
14. [Reports](#14-reports)
15. [Settings & Profile](#15-settings--profile)

### Administration
16. [Admin Capabilities (Backend Only)](#16-admin-capabilities-backend-only)

---

## 1. New User Registration Flow

### Screen: Registration Page (`/auth/register`)

**What the user sees:**

```
┌─────────────────────────────────────┐
│         Create Account              │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 👤 Full Name               │   │
│  │ [___________________]       │   │
│  └─────────────────────────────┘   │
│                                     │
│  How would you like to register?    │
│  [Email] [Phone]                    │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ ✉️ Email                    │   │ (or Phone if selected)
│  │ [___________________]       │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🌍 Country                  │   │
│  │ [India ▼]                   │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🔒 Create PIN              │   │
│  │ [____] 👁️                   │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🔒 Confirm PIN             │   │
│  │ [____] 👁️                   │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │        Register             │   │
│  └─────────────────────────────┘   │
│                                     │
│  Already have an account? Login     │
└─────────────────────────────────────┘
```

### Form Fields - What Each Means:

| Field | What User Enters | Rules/Validation | Example |
|-------|------------------|------------------|---------|
| **Full Name** | Their name | Cannot be empty | "Ramesh Kumar" |
| **Email** | Email address | Must have @ and domain | "ramesh@gmail.com" |
| **Phone** | 10-digit mobile number | Exactly 10 digits | "9876543210" |
| **Country** | Select from dropdown | Must select one | India, Kenya, Ethiopia, Nepal, Bangladesh, Vietnam |
| **PIN** | 4-digit password | Exactly 4 numbers | "1234" |
| **Confirm PIN** | Same PIN again | Must match above PIN | "1234" |

### What Happens When User Taps "Register":

1. **System checks all fields:**
   - ❌ If name is empty → Shows "This field is required"
   - ❌ If email format wrong → Shows "Please enter a valid email"
   - ❌ If PIN is not 4 digits → Shows "PIN must be 4 digits"
   - ❌ If PINs don't match → Shows "PINs do not match"

2. **If all valid, system sends to server:**
   ```
   Creates account with:
   - Name: "Ramesh Kumar"
   - Email: "ramesh@gmail.com" (or phone)
   - PIN: [encrypted]
   - Country: "IN" (India)
   ```

3. **Server responds with:**
   - User account created
   - Login token (keeps user logged in)
   - User ID (unique identifier)

4. **App saves locally:**
   - Login token (so user stays logged in)
   - User ID
   - Selected country (used later for organization filtering)

5. **User is redirected to:** `/auth/language` (Onboarding Step 1)

---

## 2. Returning User Login Flow

### Screen: Login Page (`/auth/login`)

**What the user sees:**

```
┌─────────────────────────────────────┐
│           Welcome Back              │
│                                     │
│  How would you like to login?       │
│  [Email] [Phone]                    │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ ✉️ Email                    │   │
│  │ [___________________]       │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🔒 PIN                      │   │
│  │ [____] 👁️                   │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │          Login              │   │
│  └─────────────────────────────┘   │
│                                     │
│  Don't have an account? Register    │
└─────────────────────────────────────┘
```

### What Happens When User Taps "Login":

1. **System sends to server:**
   - Email/Phone
   - PIN

2. **Server checks:**
   - ❌ If user not found → Shows "Invalid email or PIN"
   - ❌ If PIN wrong → Shows "Invalid email or PIN"
   - ✅ If correct → Returns user data + token

3. **App checks if onboarding is complete:**
   - Has user set up their farmer profile? (self_farmer_profile_id exists?)
   - **If NO** → Go to `/auth/language` (start onboarding)
   - **If YES** → Go to `/` (home dashboard)

---

## 3. Onboarding Flow (After Registration)

This is a 4-step process that runs **once** after registration (or first login if incomplete).

### Step 1: Language Selection (`/auth/language`)

**What the user sees:**

```
┌─────────────────────────────────────┐
│     Choose your preferred language  │
│           Step 1 of 4               │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🇬🇧  English         ○      │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 🇮🇳  हिन्दी (Hindi)   ●      │   │  ← Selected
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 🇮🇳  తెలుగు (Telugu)  ○      │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 🇮🇳  ಕನ್ನಡ (Kannada)  ○      │   │
│  └─────────────────────────────┘   │
│  ... (22 languages total)          │
│                                     │
│        [Next →]                     │
└─────────────────────────────────────┘
```

**Available Languages (22 total):**

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

**What happens when user selects a language:**
- The entire app UI changes to that language immediately
- Selection is saved temporarily (finalized at profile setup)

**On "Next":** Goes to Step 2 (Role Selection)

---

### Step 2: Role Selection (`/auth/role`)

**What the user sees:**

```
┌─────────────────────────────────────┐
│      What best describes you?       │
│           Step 2 of 4               │
│                                     │
│  ┌──────────┐  ┌──────────┐        │
│  │   🌾     │  │   🎓     │        │
│  │ Farmer  ✓│  │ Student  │        │
│  │ I manage │  │ Learning │        │
│  │ my cattle│  │ nutrition│        │
│  └──────────┘  └──────────┘        │
│                                     │
│  ┌──────────┐  ┌──────────┐        │
│  │   🔬     │  │   👥     │        │
│  │Nutrition-│  │Extension │        │
│  │   ist    │  │ Worker   │        │
│  │ I advise │  │ I support│        │
│  │ farmers  │  │ farmers  │        │
│  └──────────┘  └──────────┘        │
│                                     │
│  ┌──────────┐                      │
│  │   🧪     │                      │
│  │Researcher│                      │
│  │ I study  │                      │
│  │ nutrition│                      │
│  └──────────┘                      │
│                                     │
│  [← Back]          [Next →]         │
└─────────────────────────────────────┘
```

**Role Descriptions:**

| Role | Who Should Select | What They Can Do |
|------|-------------------|------------------|
| **Farmer** | Individual cattle owners | Manage own cows, log milk, get diet plans |
| **Student** | Agriculture/veterinary students | Same as Farmer (learning mode) |
| **Nutritionist** | Animal nutrition experts | View organization's farmers, give advice |
| **Extension Worker** | Field workers helping farmers | Create farmer profiles, collect data |
| **Researcher** | Research institution staff | Access analytics, export data |

**Default:** Farmer is pre-selected

**On "Next":** Goes to Step 3 (Organization Selection)

---

### Step 3: Organization Selection (`/auth/organization`)

**What the user sees:**

```
┌─────────────────────────────────────┐
│  Are you affiliated with an         │
│  organization?                      │
│           Step 3 of 4               │
│                                     │
│  🔍 [Search organizations...]       │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 👤  Not Affiliated      ●   │   │  ← Can select this
│  │     I work independently    │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🏛️  ABC University      ○   │   │
│  │     University              │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🏢  XYZ Dairy NGO       ○   │   │
│  │     NGO                     │   │
│  └─────────────────────────────┘   │
│                                     │
│  [← Back]          [Next →]         │
└─────────────────────────────────────┘
```

**How it works:**
1. App fetches organizations from server **filtered by user's country**
2. User can search by typing in search box
3. User can select "Not Affiliated" if working independently
4. Organization types shown: University, Government, NGO, Cooperative, Research

**What happens:**
- If "Not Affiliated" selected → No organization linked
- If organization selected → User is linked to that organization

**On "Next":** Goes to Step 4 (Profile Setup)

---

### Step 4: Profile Setup (`/auth/profile-setup`)

**What the user sees:**

```
┌─────────────────────────────────────┐
│       Create Your Profile           │
│           Step 4 of 4               │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 👤 Full Name               │   │
│  │ [Ramesh Kumar________]      │   │  ← Pre-filled from registration
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 📞 Phone Number (Optional)  │   │
│  │ [__________]                │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 📍 Location                 │   │
│  │                             │   │
│  │  [📍 Share My Location]     │   │
│  │                             │   │
│  │  (Auto-detects farm location│   │
│  │   using GPS)                │   │
│  └─────────────────────────────┘   │
│                                     │
│  [← Back]          [Done ✓]         │
└─────────────────────────────────────┘
```

**Note:** Location capture happens automatically when the page loads. The app uses GPS to determine the farm's location and reverse geocodes it to get the administrative area (village, district, state, etc.).

**After location is captured:**

```
┌─────────────────────────────────────┐
│  ┌─────────────────────────────┐   │
│  │ ✅ Location Captured  [🔄]  │   │
│  │                             │   │
│  │ 📍 Rajapur, Dharwad,        │   │
│  │    Karnataka, India         │   │
│  │                             │   │
│  │ State: Karnataka            │   │
│  │ District: Dharwad           │   │
│  │ Village: Rajapur            │   │
│  │                             │   │
│  │ 15.458322, 75.012456        │   │  ← GPS coordinates
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**If location fails (permission denied, etc.):**

```
┌─────────────────────────────────────┐
│  ┌─────────────────────────────┐   │
│  │ ⚠️ Location permission      │   │
│  │    denied. Please enable    │   │
│  │    location access.  [Retry]│   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Note:** Location is optional. If the user cannot or chooses not to share location, they can still complete profile setup and continue using the app. Location can be updated later.

---

## 4. Profile Setup Details

### What Gets Created: "Farmer Profile"

When user completes profile setup, a **Farmer Profile** is created with:

| Field | Description | Source | Required? |
|-------|-------------|--------|-----------|
| **name** | User's full name | Form input | ✅ Yes |
| **phone** | Contact number | Form input | ❌ No |
| **latitude** | GPS latitude | Geolocation | ❌ No |
| **longitude** | GPS longitude | Geolocation | ❌ No |
| **level_1** | Country | Reverse geocoding | ❌ No |
| **level_2** | State/Region | Reverse geocoding | ❌ No |
| **level_3** | District/Zone | Reverse geocoding | ❌ No |
| **level_4** | Taluka/Woreda | Reverse geocoding | ❌ No |
| **level_5** | Block/Kebele | Reverse geocoding | ❌ No |
| **level_6** | Village/Locality | Reverse geocoding | ❌ No |
| **village** | Same as level_6 | For compatibility | ❌ No |
| **district** | Same as level_3 | For compatibility | ❌ No |
| **state** | Same as level_2 | For compatibility | ❌ No |
| **is_self_profile** | Always `true` | System | Auto |
| **user_id** | Links to user account | System | Auto |

### Location Level Mapping by Country

The app uses generic levels (level_1 to level_6) that map to country-specific names:

| Level | India | Ethiopia | Vietnam | Nepal |
|-------|-------|----------|---------|-------|
| level_1 | Country | Country | Country | Country |
| level_2 | State | Region | Province | Province |
| level_3 | District | Zone | District | District |
| level_4 | Taluka | Woreda | Commune | Municipality |
| level_5 | Block | Kebele | Village | Ward |
| level_6 | Village | Village | Hamlet | Village |

### What Else Gets Updated

When user taps "Done", **three things happen:**

1. **User Settings Updated:**
   ```
   - Role: "farmer" (or whatever was selected)
   - Language: "hi" (Hindi, or whatever was selected)
   - Organization: UUID (or null if not affiliated)
   ```

2. **Farmer Profile Created:**
   ```
   - Name, phone, location data (as above)
   - Linked to user account
   - Marked as "self profile"
   ```

3. **User Profile Reloaded:**
   - Fetches fresh user data from server
   - Confirms onboarding is complete

---

## 5. What Gets Saved & Where

### On User's Device (Local Storage)

| Key | Value | Purpose |
|-----|-------|---------|
| `auth_token` | JWT token | Keeps user logged in |
| `user_id` | UUID | Identifies the user |
| `user_role` | "farmer", "student", etc. | Quick access to role |
| `preferred_language` | "en", "hi", etc. | Remember language choice |
| `self_farmer_profile_id` | UUID | Confirms onboarding done |
| `locale` | "en", "hi", etc. | i18n language setting |

### On Server (Database)

**user_information table:**
| Column | Example Value |
|--------|---------------|
| id | "abc123-..." |
| name | "Ramesh Kumar" |
| email | "ramesh@gmail.com" |
| pin_hash | [encrypted] |
| country_code | "IN" |
| user_role | "farmer" |
| language_code | "hi" |
| organization_id | null or UUID |

**farmer_profiles table:**
| Column | Example Value |
|--------|---------------|
| id | "def456-..." |
| user_id | "abc123-..." (links to user) |
| name | "Ramesh Kumar" |
| phone | "9876543210" |
| latitude | 15.458322 |
| longitude | 75.012456 |
| level_1 | "India" |
| level_2 | "Karnataka" |
| level_3 | "Dharwad" |
| level_6 | "Rajapur" |
| is_self_profile | true |

---

## Flow Summary Diagram

```
┌─────────────┐
│   START     │
└──────┬──────┘
       │
       ▼
┌─────────────────┐     ┌─────────────────┐
│  Have Account?  │────▶│     LOGIN       │
│                 │ Yes │  Email + PIN    │
└────────┬────────┘     └────────┬────────┘
         │ No                    │
         ▼                       │
┌─────────────────┐              │
│    REGISTER     │              │
│ Name + Email +  │              │
│ Country + PIN   │              │
└────────┬────────┘              │
         │                       │
         ▼                       ▼
┌─────────────────────────────────────┐
│     ONBOARDING (First time only)    │
├─────────────────────────────────────┤
│ Step 1: Select Language (22 options)│
│ Step 2: Select Role (5 options)     │
│ Step 3: Select Organization         │
│ Step 4: Setup Profile + Location    │
└────────────────┬────────────────────┘
                 │
                 ▼
         ┌─────────────┐
         │    HOME     │
         │  Dashboard  │
         └─────────────┘
```

---

## Error Messages & What They Mean

| Error Message | What Went Wrong | How to Fix |
|---------------|-----------------|------------|
| "This field is required" | User left a mandatory field empty | Fill in the field |
| "Please enter a valid email" | Email format wrong (no @ or domain) | Check email spelling |
| "PIN must be 4 digits" | PIN has fewer or more than 4 numbers | Enter exactly 4 numbers |
| "PINs do not match" | Confirm PIN doesn't match first PIN | Re-enter both PINs |
| "Invalid email or PIN" | Wrong credentials during login | Check email/PIN |
| "Location permission denied" | User blocked location access | Enable in browser settings |
| "Location unavailable" | GPS couldn't determine location | Try again or enter manually |
| "Location request timed out" | Took too long to get location | Try again in open area |
| "User session not found" | Login expired or cleared | Login again |
| "Failed to create profile" | Server error | Try again later |

---

## Frequently Asked Questions

**Q: Can I change my language after registration?**
A: Yes! Go to Settings → Language anytime.

**Q: Can I change my role?**
A: Yes! Go to Settings → Role anytime.

**Q: What if I don't want to share my location?**
A: Location is optional. You can tap "Done" without sharing location. The app works fine without it.

**Q: What if I'm not affiliated with any organization?**
A: Select "Not Affiliated" in Step 3. You can join one later in Settings.

**Q: Is my PIN secure?**
A: Yes, PINs are encrypted before storage. We never store plain text PINs.

**Q: Can I use phone number instead of email?**
A: Yes! Toggle between Email and Phone on login/register screens.

---

## 6. Home Dashboard

### Screen: Home Page (`/`)

**What the user sees:**

```
┌─────────────────────────────────────┐
│  Good morning, Ramesh! 👋           │
│                                     │
│  ┌─────────┐ ┌─────────┐           │
│  │   3     │ │  12.5 L │           │
│  │  Cows   │ │  Today  │           │
│  └─────────┘ └─────────┘           │
│                                     │
│  Quick Actions                      │
│  ┌─────────────────────────────┐   │
│  │ 🥛 Log Milk                 │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 🍽️ Get Diet                 │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 🐄 Add Cow                  │   │
│  └─────────────────────────────┘   │
│                                     │
│  Today's Logs                       │
│  ┌─────────────────────────────┐   │
│  │ Lakshmi    AM: 5.2L  PM: --  │   │
│  │ Ganga      AM: 4.0L  PM: 3.8L│   │
│  └─────────────────────────────┘   │
│                                     │
│  Recent Diet Plans                  │
│  ┌─────────────────────────────┐   │
│  │ Lakshmi - ₹85/day ✅ Active │   │
│  │ Jan 15, 2024                │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Dashboard Components:**

| Section | What It Shows | Tap Action |
|---------|---------------|------------|
| **Cow Count** | Total number of your cows | Goes to Cow List |
| **Today's Milk** | Sum of all milk logged today | Goes to Log List |
| **Log Milk** | Quick action button | Opens new milk log form |
| **Get Diet** | Quick action button | Opens diet wizard |
| **Add Cow** | Quick action button | Opens cow form |
| **Today's Logs** | Milk logs for today, by cow | Tap log to edit |
| **Recent Diets** | Latest diet plans | Tap to view details |

**Pull-to-Refresh:**
- Pull down on the screen to refresh all data
- Syncs with server if online

---

## 7. Cow Management

### 7.1 Cow List (`/cows`)

**What the user sees:**

```
┌─────────────────────────────────────┐
│  My Cows                            │
│  🔍 [Search cows...]                │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🐄 Lakshmi                   │   │
│  │ Holstein Friesian            │   │
│  │ 450 kg  •  8.5 L/day         │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🐄 Ganga                     │   │
│  │ Jersey                       │   │
│  │ 380 kg  •  6.2 L/day         │   │
│  │ 🔄 Pending sync              │   │  ← Offline indicator
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🐄 Radha                     │   │
│  │ Sahiwal                      │   │
│  │ 420 kg  •  5.0 L/day         │   │
│  └─────────────────────────────┘   │
│                                     │
│                        [+ Add Cow]  │  ← Floating button
└─────────────────────────────────────┘
```

**List Features:**
- **Search**: Filter cows by name
- **Card Info**: Name, breed, weight, milk yield
- **Sync Status**: Shows "Pending" if created offline
- **Empty State**: Shows "Add your first cow" if no cows

**Tap Actions:**
- Tap cow card → Go to Cow Detail page
- Tap + button → Go to Add Cow form

---

### 7.2 Add/Edit Cow Form (`/cows/new` or `/cows/:id/edit`)

**What the user sees:**

```
┌─────────────────────────────────────┐
│  Add Cow                            │
│                                     │
│  Basic Information                  │
│  ┌─────────────────────────────┐   │
│  │ 🐄 Cow Name *                │   │
│  │ [___________________]        │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🏷️ Breed *                   │   │
│  │ [Select breed ▼]             │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ ⚖️ Body Weight (kg) *        │   │
│  │ [___________]                │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 📅 Age (months)              │   │
│  │ [___________]                │   │
│  └─────────────────────────────┘   │
│                                     │
│  Milk Production                    │
│  ┌─────────────────────────────┐   │
│  │ 🥛 Current Yield (L/day) *   │   │
│  │ [___________]                │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🧈 Milk Fat (%) *            │   │
│  │ [___________]                │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🔄 Lactation Stage *         │   │
│  │ [Early Lactation ▼]          │   │
│  └─────────────────────────────┘   │
│                                     │
│  Health & Condition                 │
│  ┌─────────────────────────────┐   │
│  │ 📊 Body Condition Score      │   │
│  │ [3 - Average ▼]              │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🏃 Activity Level            │   │
│  │ [Normal ▼]                   │   │
│  └─────────────────────────────┘   │
│                                     │
│  ☑️ Is Pregnant?                    │
│  ┌─────────────────────────────┐   │
│  │ 🤰 Pregnancy Month           │   │  ← Only if pregnant
│  │ [___________]                │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 📝 Notes                     │   │
│  │ [___________________]        │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │         Save Cow             │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Form Fields Explained:**

| Field | What to Enter | Options/Validation | Required? |
|-------|--------------|-------------------|-----------|
| **Cow Name** | Name you call the cow | Any text | ✅ Yes |
| **Breed** | Cow's breed | Holstein Friesian, Jersey, Sahiwal, Gir, Red Sindhi, Crossbreed, Other | ✅ Yes |
| **Body Weight** | Current weight in kg | 100-1000 kg | ✅ Yes |
| **Age** | Age in months | 0-300 months | ❌ No |
| **Milk Yield** | Daily milk production | 0-50 liters | ✅ Yes |
| **Milk Fat %** | Fat content in milk | 1-10% | ✅ Yes |
| **Lactation Stage** | Current lactation phase | Early (0-100 days), Mid (100-200), Late (200+), Dry | ✅ Yes |
| **Body Condition** | How well-fed the cow is | 1 (Very Thin) to 5 (Very Fat) | ❌ No |
| **Activity Level** | How active the cow is | Low, Normal, High | ❌ No |
| **Is Pregnant** | Whether cow is pregnant | Yes/No checkbox | ❌ No |
| **Pregnancy Month** | Month of pregnancy | 1-9 months (only if pregnant) | ❌ No |
| **Notes** | Any additional info | Free text | ❌ No |

**What happens on Save:**
1. Data saved locally (works offline)
2. If online, syncs to server immediately
3. If offline, marked "Pending sync"
4. Shows success message
5. Returns to cow list

---

### 7.3 Cow Detail Page (`/cows/:id`)

**What the user sees:**

```
┌─────────────────────────────────────┐
│  ← Back                    [Edit ✏️]│
│                                     │
│  ┌─────────────────────────────┐   │
│  │        🐄 LAKSHMI            │   │
│  │     Holstein Friesian        │   │
│  └─────────────────────────────┘   │
│                                     │
│  Quick Stats                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐
│  │  450 kg │ │ 8.5 L   │ │  3.8%   │
│  │ Weight  │ │ Per Day │ │   Fat   │
│  └─────────┘ └─────────┘ └─────────┘
│                                     │
│  Quick Actions                      │
│  ┌─────────────┐ ┌─────────────┐   │
│  │ 🥛 Log Milk │ │ 🍽️ Get Diet │   │
│  └─────────────┘ └─────────────┘   │
│                                     │
│  Details                            │
│  ┌─────────────────────────────┐   │
│  │ Lactation: Early             │   │
│  │ Body Score: 3 (Average)      │   │
│  │ Activity: Normal             │   │
│  │ Pregnant: Yes (Month 4)      │   │
│  └─────────────────────────────┘   │
│                                     │
│  Recent Milk Logs                   │
│  ┌─────────────────────────────┐   │
│  │ Today      AM: 4.2L  PM: 4.3L│   │
│  │ Yesterday  AM: 4.0L  PM: 4.5L│   │
│  │ Jan 13     AM: 4.1L  PM: 4.2L│   │
│  └─────────────────────────────┘   │
│                                     │
│                        [✏️ Edit]    │  ← Floating button
└─────────────────────────────────────┘
```

**Page Sections:**

| Section | What It Shows |
|---------|---------------|
| **Header** | Cow name and breed |
| **Quick Stats** | Weight, daily yield, fat % |
| **Quick Actions** | Log Milk (for this cow), Get Diet (for this cow) |
| **Details** | All other cow attributes |
| **Recent Logs** | Last 5 milk logs for this cow |

---

## 8. Diet Optimization

### 8.1 Diet List (`/diet`)

**What the user sees:**

```
┌─────────────────────────────────────┐
│  Diet Plans                         │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🐄 Lakshmi                   │   │
│  │ ✅ Completed • Jan 15, 2024  │   │
│  │ ₹85/day • 12.5 kg DM         │   │
│  │ Goal: Balanced               │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🐄 Ganga                     │   │
│  │ ⏳ Processing...             │   │  ← Being calculated
│  │ Jan 16, 2024                 │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🐄 Radha                     │   │
│  │ ❌ Failed • Jan 14, 2024     │   │  ← Error occurred
│  │ No feasible solution         │   │
│  └─────────────────────────────┘   │
│                                     │
│                     [+ New Diet]    │
└─────────────────────────────────────┘
```

**Diet Status Types:**

| Status | Icon | Meaning |
|--------|------|---------|
| **Completed** | ✅ | Diet calculated successfully |
| **Processing** | ⏳ | Server is calculating |
| **Failed** | ❌ | Couldn't find valid diet |
| **Pending** | 🔄 | Waiting to be processed |

---

### 8.2 Diet Wizard (`/diet/new`)

**5-Step Process:**

#### Step 1: Select Cow

```
┌─────────────────────────────────────┐
│  Get Diet Recommendation            │
│  Step 1 of 5: Select Cow            │
│                                     │
│  ○ Select from my cows              │
│  ┌─────────────────────────────┐   │
│  │ [Select a cow ▼]             │   │
│  └─────────────────────────────┘   │
│                                     │
│  ○ Enter details manually           │
│  (For a cow not in your list)       │
│                                     │
│              [Next →]               │
└─────────────────────────────────────┘
```

#### Step 2: Animal Details

```
┌─────────────────────────────────────┐
│  Step 2 of 5: Animal Details        │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ ⚖️ Body Weight (kg) *        │   │
│  │ [450_____________]           │   │  ← Pre-filled if cow selected
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🥛 Daily Milk Yield (L) *    │   │
│  │ [8.5______________]          │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🧈 Milk Fat (%) *            │   │
│  │ [3.8______________]          │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🔄 Lactation Stage *         │   │
│  │ [Early Lactation ▼]          │   │
│  └─────────────────────────────┘   │
│                                     │
│  ☑️ Is Pregnant?                    │
│  ┌─────────────────────────────┐   │
│  │ 🤰 Pregnancy Month           │   │
│  │ [4_________________]         │   │
│  └─────────────────────────────┘   │
│                                     │
│  [← Back]            [Next →]       │
└─────────────────────────────────────┘
```

#### Step 3: Select Available Feeds

```
┌─────────────────────────────────────┐
│  Step 3 of 5: Available Feeds       │
│                                     │
│  🔍 [Search feeds...]               │
│                                     │
│  Select feeds you have available:   │
│                                     │
│  Roughages                          │
│  ☑️ Green Maize (₹2/kg)             │
│  ☑️ Napier Grass (₹1.5/kg)          │
│  ☐ Wheat Straw (₹3/kg)              │
│                                     │
│  Concentrates                       │
│  ☑️ Maize Grain (₹25/kg)            │
│  ☑️ Cotton Seed Cake (₹30/kg)       │
│  ☐ Groundnut Cake (₹45/kg)          │
│                                     │
│  Minerals                           │
│  ☑️ Mineral Mixture (₹60/kg)        │
│  ☐ Common Salt (₹15/kg)             │
│                                     │
│  Selected: 5 feeds                  │
│                                     │
│  [← Back]            [Next →]       │
└─────────────────────────────────────┘
```

**Feed Selection Notes:**
- Must select at least 3 feeds
- Shows price per kg for each feed
- Grouped by category (Roughages, Concentrates, Minerals, etc.)
- Search to filter feeds

#### Step 4: Optimization Goal

```
┌─────────────────────────────────────┐
│  Step 4 of 5: Optimization Goal     │
│                                     │
│  What is your priority?             │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 💰 Minimize Cost        ●   │   │
│  │ Cheapest diet that meets    │   │
│  │ nutritional needs           │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🥛 Maximize Milk        ○   │   │
│  │ Optimize for highest        │   │
│  │ milk production             │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ ⚖️ Balanced             ○   │   │
│  │ Balance between cost        │   │
│  │ and production              │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 💵 Daily Budget (Optional)   │   │
│  │ [₹ ___________]              │   │
│  │ Leave empty for no limit     │   │
│  └─────────────────────────────┘   │
│                                     │
│  [← Back]            [Next →]       │
└─────────────────────────────────────┘
```

**Goal Options:**

| Goal | What It Does |
|------|--------------|
| **Minimize Cost** | Finds cheapest diet meeting requirements |
| **Maximize Milk** | Optimizes for highest production |
| **Balanced** | Trade-off between cost and production |

#### Step 5: Review & Submit

```
┌─────────────────────────────────────┐
│  Step 5 of 5: Review                │
│                                     │
│  Animal                             │
│  ┌─────────────────────────────┐   │
│  │ Cow: Lakshmi                 │   │
│  │ Weight: 450 kg               │   │
│  │ Milk: 8.5 L/day              │   │
│  │ Fat: 3.8%                    │   │
│  │ Lactation: Early             │   │
│  │ Pregnant: Yes (Month 4)      │   │
│  └─────────────────────────────┘   │
│                                     │
│  Selected Feeds                     │
│  ┌─────────────────────────────┐   │
│  │ • Green Maize                │   │
│  │ • Napier Grass               │   │
│  │ • Maize Grain                │   │
│  │ • Cotton Seed Cake           │   │
│  │ • Mineral Mixture            │   │
│  └─────────────────────────────┘   │
│                                     │
│  Goal: Minimize Cost                │
│  Budget: No limit                   │
│                                     │
│  ⚠️ Requires internet connection    │
│                                     │
│  [← Back]      [Generate Diet 🚀]   │
└─────────────────────────────────────┘
```

**On Submit:**
1. Sends request to server
2. Shows loading indicator
3. Server calculates optimal diet
4. On success → Goes to Diet Detail
5. On failure → Shows error message

---

### 8.3 Diet Detail Page (`/diet/:id`)

**What the user sees:**

```
┌─────────────────────────────────────┐
│  ← Back                             │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ ✅ Diet Ready                │   │
│  │ for Lakshmi                  │   │
│  │ Generated: Jan 15, 2024      │   │
│  └─────────────────────────────┘   │
│                                     │
│  Summary                            │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐
│  │ ₹85     │ │ 12.5 kg │ │   5     │
│  │ Per Day │ │   DM    │ │ Feeds   │
│  └─────────┘ └─────────┘ └─────────┘
│                                     │
│  Daily Feed Amounts                 │
│  ┌─────────────────────────────┐   │
│  │ Feed           Amount   Cost │   │
│  │ ─────────────────────────── │   │
│  │ Green Maize    15.0 kg  ₹30  │   │
│  │ Napier Grass   10.0 kg  ₹15  │   │
│  │ Maize Grain     2.0 kg  ₹50  │   │
│  │ Cotton Cake     1.5 kg  ₹45  │   │
│  │ Mineral Mix     0.1 kg   ₹6  │   │
│  └─────────────────────────────┘   │
│                                     │
│  Nutrient Balance                   │
│  ┌─────────────────────────────┐   │
│  │ Crude Protein (CP)           │   │
│  │ ████████████░░░░ 82%         │   │
│  │ Required: 950g  Provided: 780g│  │
│  │                              │   │
│  │ Energy (TDN)                 │   │
│  │ ████████████████ 100%        │   │
│  │ Required: 7.2kg  Provided: 7.2kg│ │
│  │                              │   │
│  │ Dry Matter (DM)              │   │
│  │ ███████████████░ 95%         │   │
│  │ Required: 13kg  Provided: 12.5kg│ │
│  └─────────────────────────────┘   │
│                                     │
│  Recommendations                    │
│  ┌─────────────────────────────┐   │
│  │ 💡 Feed green fodder in the  │   │
│  │    morning for better intake │   │
│  │ 💡 Provide clean water       │   │
│  │    throughout the day        │   │
│  └─────────────────────────────┘   │
│                                     │
│  Warnings                           │
│  ┌─────────────────────────────┐   │
│  │ ⚠️ Protein slightly below    │   │
│  │    requirement. Consider     │   │
│  │    adding more concentrate.  │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Page Sections:**

| Section | What It Shows |
|---------|---------------|
| **Header** | Status, cow name, generation date |
| **Summary** | Daily cost, DM intake, feed count |
| **Feed Amounts** | Each feed with amount (kg) and cost |
| **Nutrient Balance** | Progress bars showing requirement coverage |
| **Recommendations** | Tips for feeding |
| **Warnings** | Any nutritional concerns |

---

## 9. Milk Logging

### 9.1 Log List (`/logs`)

**What the user sees:**

```
┌─────────────────────────────────────┐
│  Milk Logs                          │
│                                     │
│  ┌─────────┐ ┌─────────┐           │
│  │  12.5 L │ │  84.2 L │           │
│  │  Today  │ │  Week   │           │
│  └─────────┘ └─────────┘           │
│                                     │
│  Filter: [All Cows ▼]               │
│  Date: [Jan 10 - Jan 16 ▼]          │
│                                     │
│  Today, Jan 16                      │
│  ┌─────────────────────────────┐   │
│  │ 🐄 Lakshmi                   │   │
│  │ AM: 4.2 L  •  PM: 4.3 L      │   │
│  │ Total: 8.5 L                 │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 🐄 Ganga                     │   │
│  │ AM: 3.0 L  •  PM: --         │   │  ← Evening not logged
│  │ Total: 3.0 L                 │   │
│  └─────────────────────────────┘   │
│                                     │
│  Yesterday, Jan 15                  │
│  ┌─────────────────────────────┐   │
│  │ 🐄 Lakshmi                   │   │
│  │ AM: 4.0 L  •  PM: 4.5 L      │   │
│  │ Total: 8.5 L                 │   │
│  └─────────────────────────────┘   │
│                                     │
│                       [+ Add Log]   │
└─────────────────────────────────────┘
```

**Features:**
- **Summary Cards**: Today's total, week's total
- **Filter by Cow**: See logs for specific cow
- **Date Range**: Filter by date range
- **Grouped by Date**: Logs organized by day
- **Pull-to-refresh**: Sync with server

---

### 9.2 Log Form (`/logs/new` or `/logs/:id/edit`)

**What the user sees:**

```
┌─────────────────────────────────────┐
│  Log Milk Production                │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🐄 Select Cow *              │   │
│  │ [Lakshmi ▼]                  │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 📅 Date *                    │   │
│  │ [Jan 16, 2024] 📆            │   │
│  └─────────────────────────────┘   │
│                                     │
│  Milk Production                    │
│  ┌─────────────────────────────┐   │
│  │        Morning  │  Evening   │   │
│  │   ☀️           │    🌙      │   │
│  │  [4.2___] L    │  [4.3___] L│   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │         Total: 8.5 L         │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🧈 Fat % (Optional)          │   │
│  │ [3.8___________]             │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 📝 Notes (Optional)          │   │
│  │ [Cow seemed healthy today]   │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │         Save Log             │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │        Delete Log            │   │  ← Only in edit mode
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Form Fields:**

| Field | Description | Required? |
|-------|-------------|-----------|
| **Cow** | Which cow this log is for | ✅ Yes |
| **Date** | Date of the log | ✅ Yes |
| **Morning (L)** | Morning milk in liters | ❌ No* |
| **Evening (L)** | Evening milk in liters | ❌ No* |
| **Fat %** | Milk fat percentage | ❌ No |
| **Notes** | Any observations | ❌ No |

*At least one (morning or evening) must have a value.

**Validation:**
- At least one milk reading required
- Cannot be negative
- Date cannot be in the future

---

## 10. Feed Management

### 10.1 Feed List (`/feeds`)

**What the user sees:**

```
┌─────────────────────────────────────┐
│  Feeds                              │
│                                     │
│  [Master Feeds] [My Feeds]          │  ← Tabs
│                                     │
│  🔍 [Search feeds...]               │
│                                     │
│  Concentrates                       │
│  ┌─────────────────────────────┐   │
│  │ Maize Grain                  │   │
│  │ CP: 9%  TDN: 80%  DM: 88%    │   │
│  │ ₹25/kg                       │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ Cotton Seed Cake             │   │
│  │ CP: 24%  TDN: 72%  DM: 90%   │   │
│  │ ₹30/kg                       │   │
│  └─────────────────────────────┘   │
│                                     │
│  Roughages                          │
│  ┌─────────────────────────────┐   │
│  │ Napier Grass                 │   │
│  │ CP: 8%  TDN: 55%  DM: 22%    │   │
│  │ ₹1.5/kg                      │   │
│  └─────────────────────────────┘   │
│                                     │
│               [+ Add Custom Feed]   │
└─────────────────────────────────────┘
```

**Tab Descriptions:**

| Tab | What It Shows |
|-----|---------------|
| **Master Feeds** | Standard feeds from database (read-only) |
| **My Feeds** | Custom feeds you've created |

**Feed Card Info:**
- Name
- CP% (Crude Protein)
- TDN% (Total Digestible Nutrients)
- DM% (Dry Matter)
- Price per kg

---

### 10.2 Feed Form (`/feeds/new` or `/feeds/:id/edit`)

**What the user sees:**

```
┌─────────────────────────────────────┐
│  Add Custom Feed                    │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🏷️ Feed Name *               │   │
│  │ [___________________]        │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 📁 Category *                │   │
│  │ [Select category ▼]          │   │
│  └─────────────────────────────┘   │
│                                     │
│  Nutritional Values                 │
│  ┌─────────────────────────────┐   │
│  │ Dry Matter (%) *             │   │
│  │ [___________]                │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ Crude Protein (%) *          │   │
│  │ [___________]                │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ TDN (%) *                    │   │
│  │ [___________]                │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ NDF (%)                      │   │
│  │ [___________]                │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ Calcium (%)                  │   │
│  │ [___________]                │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ Phosphorus (%)               │   │
│  │ [___________]                │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 💰 Price per kg              │   │
│  │ [₹ ___________]              │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │          Save Feed           │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Feed Categories:**
- Concentrate
- Roughage
- Green Fodder
- Dry Fodder
- Silage
- By-product
- Mineral Mix
- Other

---

## 11. Extension Worker Dashboard

**Who sees this:** Users with role "Extension Worker" or "Nutritionist" who manage multiple farmers.

### How It Works

The system detects if a user is managing farmers by checking:
1. User's role is "extension_worker" or "nutritionist"
2. User has created farmer profiles (farmers they support)

### Dashboard Hierarchy

For Extension Workers, the data hierarchy is different:

```
┌─────────────────────────────────────────────────────────┐
│                     EXTENSION WORKER                     │
│                    (manages farmers)                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│   ┌──────────────┐   ┌──────────────┐   ┌────────────┐  │
│   │   Farmer 1   │   │   Farmer 2   │   │  Farmer 3  │  │
│   │  Ramesh K.   │   │  Suresh P.   │   │ Lakshmi D. │  │
│   ├──────────────┤   ├──────────────┤   ├────────────┤  │
│   │ 🐄 Cow A     │   │ 🐄 Cow C     │   │ 🐄 Cow E   │  │
│   │ 🐄 Cow B     │   │ 🐄 Cow D     │   │            │  │
│   └──────────────┘   └──────────────┘   └────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Key Difference from Farmer Dashboard:**
- Farmers manage their OWN cows directly
- Extension workers manage FARMERS, who each have their own cows
- Diet plans are for farmers' cows, not the extension worker's own cows

### Extension Worker Dashboard View

**What the extension worker sees:**

```
┌─────────────────────────────────────┐
│  Hello, Sangeeta!                   │
│  Extension Worker                   │
│                                     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐
│  │   12    │ │   28    │ │  85.2 L │
│  │ Farmers │ │  Cows   │ │  Today  │
│  └─────────┘ └─────────┘ └─────────┘
│                                     │
│  Quick Actions                      │
│  ┌─────────────────────────────┐   │
│  │ 👤 Add New Farmer            │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 📝 Record Yield              │   │  ← Opens farmer selector first
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 📊 View Reports              │   │
│  └─────────────────────────────┘   │
│                                     │
│  My Farmers                         │
│  ┌─────────────────────────────┐   │
│  │ 👤 Ramesh Kumar              │   │
│  │ 📍 Rajapur • 5 cows • 18.5 L │   │
│  │ ────────────────────────────│   │
│  │ 👤 Suresh Patil              │   │
│  │ 📍 Hubli • 3 cows • 12.2 L   │   │
│  │ ────────────────────────────│   │
│  │ 👤 Lakshmi Devi              │   │
│  │ 📍 Navalgund • 2 cows • 8.0 L│   │
│  │ ────────────────────────────│   │
│  │          View All →          │   │
│  └─────────────────────────────┘   │
│                                     │
│  Recent Activity                    │
│  ┌─────────────────────────────┐   │
│  │ 🥛 Ramesh: Logged 8.5L       │   │
│  │ 🍽️ Suresh: Diet created      │   │
│  │ 🐄 Lakshmi: Added new cow    │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Dashboard Stats for Extension Workers

| Stat | What It Shows |
|------|---------------|
| **Farmers** | Total farmers managed by this extension worker |
| **Cows** | Total cows across ALL managed farmers |
| **Today's Milk** | Combined milk production from all farmers today |

### Quick Actions Difference

| Farmer Dashboard | Extension Worker Dashboard |
|------------------|---------------------------|
| Log Milk → Direct to log form | Record Yield → Select farmer first |
| Get Diet → Direct to wizard | Get Diet → Select farmer first |
| Add Cow → Direct to cow form | Add Farmer → Add new farmer profile |

### Action Flow: Recording Yield for a Farmer

When extension worker taps "Record Yield":

```
┌─────────────────────────────────────┐
│  Select Farmer                      │
│                                     │
│  🔍 [Search farmers...]             │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 👤 Ramesh Kumar          >   │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 👤 Suresh Patil          >   │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 👤 Lakshmi Devi          >   │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
         │
         ▼ (Tap Ramesh Kumar)
┌─────────────────────────────────────┐
│  Select Cow                         │
│  Farmer: Ramesh Kumar               │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🐄 Lakshmi (8.5 L/day)   >   │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 🐄 Ganga (6.2 L/day)     >   │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
         │
         ▼ (Tap Lakshmi)
┌─────────────────────────────────────┐
│  Log Milk Production                │
│  Farmer: Ramesh Kumar               │
│  Cow: Lakshmi                       │
│                                     │
│  (Regular log form appears)         │
└─────────────────────────────────────┘
```

### Action Flow: Getting Diet for a Farmer's Cow

```
Extension Worker Dashboard
         │
         ▼ Taps "Get Diet"
┌─────────────────────────────────────┐
│  Select Farmer                      │
│  ┌─────────────────────────────┐   │
│  │ 👤 Ramesh Kumar          >   │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
         │
         ▼ (Selects farmer)
┌─────────────────────────────────────┐
│  Get Diet Recommendation            │
│  Farmer: Ramesh Kumar               │
│                                     │
│  Step 1: Select Cow                 │
│  (Shows ONLY Ramesh's cows)         │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🐄 Lakshmi               ●   │   │
│  │ 🐄 Ganga                 ○   │   │
│  └─────────────────────────────┘   │
│                                     │
│              [Next →]               │
└─────────────────────────────────────┘
         │
         ▼ (Continue with normal diet wizard)
```

### Viewing a Farmer's Details

When extension worker taps on a farmer from the list:

```
┌─────────────────────────────────────┐
│  ← Back                    [Edit ✏️]│
│                                     │
│  ┌─────────────────────────────┐   │
│  │        👤 RAMESH KUMAR       │   │
│  │     📍 Rajapur, Dharwad      │   │
│  │     📞 9876543210            │   │
│  └─────────────────────────────┘   │
│                                     │
│  Quick Stats                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐
│  │    5    │ │    3    │ │  18.5 L │
│  │  Cows   │ │Lactating│ │  Today  │
│  └─────────┘ └─────────┘ └─────────┘
│                                     │
│  Quick Actions                      │
│  ┌─────────────┐ ┌─────────────┐   │
│  │ 🥛 Log Milk │ │ 🍽️ Get Diet │   │
│  └─────────────┘ └─────────────┘   │
│  ┌─────────────┐ ┌─────────────┐   │
│  │ 🐄 Add Cow  │ │ 📊 Reports  │   │
│  └─────────────┘ └─────────────┘   │
│                                     │
│  Cattle                             │
│  ┌─────────────────────────────┐   │
│  │ 🐄 Lakshmi                   │   │
│  │ Holstein • 450kg • 8.5 L/day │   │
│  │ ────────────────────────────│   │
│  │ 🐄 Ganga                     │   │
│  │ Jersey • 380kg • 6.2 L/day   │   │
│  │ ────────────────────────────│   │
│  │ 🐄 Radha                     │   │
│  │ Sahiwal • 420kg • 3.8 L/day  │   │
│  └─────────────────────────────┘   │
│                                     │
│  Recent Milk Logs                   │
│  ┌─────────────────────────────┐   │
│  │ Today: Lakshmi 8.5L          │   │
│  │ Today: Ganga 6.2L            │   │
│  │ Yesterday: Lakshmi 8.2L      │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Data Relationships

```
┌─────────────────────────────────────────────────────────┐
│                      USER TABLE                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ id: "ext-001"                                      │ │
│  │ name: "Sangeeta"                                   │ │
│  │ user_role: "extension_worker"                      │ │
│  │ self_farmer_profile_id: "fp-sangeeta" (own farm)   │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ FARMER      │  │ FARMER      │  │ FARMER      │
│ PROFILE     │  │ PROFILE     │  │ PROFILE     │
│ ──────────  │  │ ──────────  │  │ ──────────  │
│ id: "fp-001"│  │ id: "fp-002"│  │ id: "fp-003"│
│ name: Ramesh│  │ name: Suresh│  │name: Lakshmi│
│ managed_by: │  │ managed_by: │  │ managed_by: │
│  "ext-001"  │  │  "ext-001"  │  │  "ext-001"  │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       ▼                ▼                ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│    COWS     │  │    COWS     │  │    COWS     │
│ ──────────  │  │ ──────────  │  │ ──────────  │
│ farmer_     │  │ farmer_     │  │ farmer_     │
│ profile_id: │  │ profile_id: │  │ profile_id: │
│  "fp-001"   │  │  "fp-002"   │  │  "fp-003"   │
│             │  │             │  │             │
│ • Lakshmi   │  │ • Meera     │  │ • Tulsi     │
│ • Ganga     │  │ • Sarita    │  │             │
│ • Radha     │  │             │  │             │
└─────────────┘  └─────────────┘  └─────────────┘
```

### Navigation Menu Differences

**Farmer Navigation:**
```
🏠 Home
🐄 My Cows
🍽️ Diet Plans
🥛 Milk Logs
🌾 Feeds
📊 Reports
⚙️ Settings
```

**Extension Worker Navigation:**
```
🏠 Home (Dashboard)
👥 My Farmers       ← NEW: List of managed farmers
🐄 All Cattle       ← Shows cows grouped by farmer
🍽️ Diet Plans       ← Shows diets grouped by farmer
🥛 Yield History    ← Shows logs grouped by farmer
🌾 Feeds
📊 Reports
⚙️ Settings
```

### Detection Logic

The app determines dashboard type based on:

```
IF user.role = "extension_worker" OR user.role = "nutritionist"
  AND farmer_profiles.count > 0 (where managed_by_user_id = user.id)
THEN
  Show Extension Worker Dashboard
ELSE
  Show Farmer Dashboard
```

### Empty State for New Extension Workers

If an extension worker hasn't added any farmers yet:

```
┌─────────────────────────────────────┐
│  Hello, Sangeeta!                   │
│  Extension Worker                   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │    👥                        │   │
│  │    No farmers yet           │   │
│  │                             │   │
│  │  Start by adding farmers    │   │
│  │  you support to track their │   │
│  │  cattle and milk production │   │
│  │                             │   │
│  │  ┌─────────────────────┐   │   │
│  │  │   Add First Farmer  │   │   │
│  │  └─────────────────────┘   │   │
│  │                             │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

---

## 12. Farmer Management

**Note:** This feature is for Extension Workers and Nutritionists who support multiple farmers.

### 11.1 Farmer List (`/farmers`)

**What the user sees:**

```
┌─────────────────────────────────────┐
│  Farmers I Support                  │
│                                     │
│  🔍 [Search farmers...]             │
│  Filter: [All ▼] (Dairy/Mixed/Crop) │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 👤 Ramesh Kumar              │   │
│  │ 📍 Rajapur, Dharwad          │   │
│  │ 🐄 5 cattle  •  Dairy        │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 👤 Suresh Patil              │   │
│  │ 📍 Hubli, Dharwad            │   │
│  │ 🐄 3 cattle  •  Mixed        │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 👤 Lakshmi Devi              │   │
│  │ 📍 Navalgund, Dharwad        │   │
│  │ 🐄 2 cattle  •  Dairy        │   │
│  └─────────────────────────────┘   │
│                                     │
│                    [+ Add Farmer]   │
└─────────────────────────────────────┘
```

**Features:**
- Search farmers by name
- Filter by farming type
- Shows location and cattle count
- Tap to view farmer details

---

### 11.2 Farmer Form (`/farmers/new` or `/farmers/:id/edit`)

**What the user sees:**

```
┌─────────────────────────────────────┐
│  Add Farmer                         │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 👤 Farmer Name *             │   │
│  │ [___________________]        │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 📞 Phone Number              │   │
│  │ [___________________]        │   │
│  └─────────────────────────────┘   │
│                                     │
│  Location                           │
│  ┌─────────────────────────────┐   │
│  │ 🏘️ Village                   │   │
│  │ [___________________]        │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 🏛️ District                  │   │
│  │ [___________________]        │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 🗺️ State                     │   │
│  │ [___________________]        │   │
│  └─────────────────────────────┘   │
│                                     │
│  Farm Details                       │
│  ┌─────────────────────────────┐   │
│  │ 🐄 Total Cattle              │   │
│  │ [___________]                │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 🌾 Land (acres)              │   │
│  │ [___________]                │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 🚜 Farming Type              │   │
│  │ [Dairy ▼]                    │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │        Save Farmer           │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Farming Types:**
- Dairy (primarily cattle)
- Mixed (cattle + crops)
- Crop (primarily crops)

---

### 11.3 Farmer Detail Page (`/farmers/:id`)

**What the user sees:**

```
┌─────────────────────────────────────┐
│  ← Back                    [Edit ✏️]│
│                                     │
│  ┌─────────────────────────────┐   │
│  │        👤 RAMESH KUMAR       │   │
│  │     📍 Rajapur, Dharwad      │   │
│  │     📞 9876543210            │   │
│  └─────────────────────────────┘   │
│                                     │
│  Quick Stats                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐
│  │    5    │ │    3    │ │  15.2 L │
│  │ Cattle  │ │Lactating│ │  Daily  │
│  └─────────┘ └─────────┘ └─────────┘
│                                     │
│  Farm Details                       │
│  ┌─────────────────────────────┐   │
│  │ Type: Dairy                  │   │
│  │ Land: 2.5 acres              │   │
│  │ Added: Jan 10, 2024          │   │
│  └─────────────────────────────┘   │
│                                     │
│  Cattle                             │
│  ┌─────────────────────────────┐   │
│  │ 🐄 Lakshmi - 8.5 L/day       │   │
│  │ 🐄 Ganga - 6.2 L/day         │   │
│  │ 🐄 Radha - 5.0 L/day         │   │
│  │                   [+ Add Cow]│   │
│  └─────────────────────────────┘   │
│                                     │
│  Quick Actions                      │
│  ┌─────────────┐ ┌─────────────┐   │
│  │Record Yield │ │View History │   │
│  └─────────────┘ └─────────────┘   │
└─────────────────────────────────────┘
```

**Actions Available:**
- Add cows for this farmer
- Record yield (milk production)
- View yield history
- Edit farmer details

---

## 13. Yield History

### Screen: Yield History (`/yields`)

**What the user sees:**

```
┌─────────────────────────────────────┐
│  Yield History                      │
│                                     │
│  Filter by Farmer: [All ▼]          │
│  Date Range: [Jan 1 - Jan 16 ▼]     │
│                                     │
│  Summary                            │
│  ┌─────────────────────────────┐   │
│  │ Records: 45                  │   │
│  │ Avg Yield: 7.2 L             │   │
│  │ Avg Fat: 3.6%                │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Jan 16, 2024                 │   │
│  │ Ramesh Kumar - Lakshmi       │   │
│  │ AM: 4.2L  PM: 4.3L  = 8.5L   │   │
│  │ Fat: 3.8%                    │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Jan 16, 2024                 │   │
│  │ Suresh Patil - Ganga         │   │
│  │ AM: 3.0L  PM: 3.2L  = 6.2L   │   │
│  │ Fat: 3.5%                    │   │
│  └─────────────────────────────┘   │
│                                     │
│  ... more records ...               │
└─────────────────────────────────────┘
```

**Features:**
- Filter by specific farmer
- Date range selection
- Summary statistics (record count, averages)
- Individual yield records

---

## 14. Reports

### 14.1 Report List (`/reports`)

**What the user sees:**

```
┌─────────────────────────────────────┐
│  Reports                            │
│                                     │
│  Generate Report                    │
│  ┌─────────────────────────────┐   │
│  │ Report Type *                │   │
│  │ [Milk Production ▼]          │   │
│  │                              │   │
│  │ Date Range *                 │   │
│  │ [Last 7 Days ▼]              │   │
│  │                              │   │
│  │ Cow (Optional)               │   │
│  │ [All Cows ▼]                 │   │
│  │                              │   │
│  │      [Generate Report]       │   │
│  └─────────────────────────────┘   │
│                                     │
│  Recent Reports                     │
│  ┌─────────────────────────────┐   │
│  │ 📊 Milk Production           │   │
│  │ ✅ Jan 10-16, 2024           │   │
│  │ All Cows                     │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 📊 Feed Cost Analysis        │   │
│  │ ✅ Jan 1-15, 2024            │   │
│  │ Lakshmi                      │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Report Types:**

| Type | What It Shows |
|------|---------------|
| **Milk Production** | Daily/weekly milk yields per cow |
| **Feed Consumption** | Feed usage and costs |
| **Cow Performance** | Individual cow metrics over time |
| **Cost Analysis** | Feed costs vs milk revenue |

**Date Range Options:**
- Last 7 Days
- Last 30 Days
- Last 90 Days
- Custom Range

---

### 14.2 Report Detail (`/reports/:id`)

**What the user sees:**

```
┌─────────────────────────────────────┐
│  ← Back                             │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Milk Production Report      │   │
│  │  Jan 10 - Jan 16, 2024       │   │
│  │                    [📥 PDF]  │   │
│  └─────────────────────────────┘   │
│                                     │
│  Parameters                         │
│  ┌─────────────────────────────┐   │
│  │ Period: Jan 10 - Jan 16      │   │
│  │ Cows: All (3 cows)           │   │
│  │ Generated: Jan 16, 2024      │   │
│  └─────────────────────────────┘   │
│                                     │
│  Summary                            │
│  ┌─────────────────────────────┐   │
│  │ Total Milk: 147.5 L          │   │
│  │ Daily Average: 21.1 L        │   │
│  │ Best Day: Jan 14 (24.2 L)    │   │
│  │ Lowest Day: Jan 11 (18.5 L)  │   │
│  └─────────────────────────────┘   │
│                                     │
│  By Cow                             │
│  ┌─────────────────────────────┐   │
│  │ Lakshmi: 59.5 L (40%)        │   │
│  │ Ganga: 49.0 L (33%)          │   │
│  │ Radha: 39.0 L (27%)          │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Download Full Report PDF]         │
└─────────────────────────────────────┘
```

**Features:**
- Download as PDF
- Summary statistics
- Breakdown by cow
- Visual charts (when applicable)

---

## 15. Settings & Profile

### 15.1 Settings Page (`/settings`)

**What the user sees:**

```
┌─────────────────────────────────────┐
│  Settings                           │
│                                     │
│  Profile                            │
│  ┌─────────────────────────────┐   │
│  │ 👤 My Profile            >   │   │
│  └─────────────────────────────┘   │
│                                     │
│  Preferences                        │
│  ┌─────────────────────────────┐   │
│  │ 🌐 Language                  │   │
│  │ English                  >   │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 👤 Role                      │   │
│  │ Farmer                   >   │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 🏢 Organization              │   │
│  │ Not affiliated           >   │   │
│  └─────────────────────────────┘   │
│                                     │
│  App Settings                       │
│  ┌─────────────────────────────┐   │
│  │ 🔔 Push Notifications        │   │
│  │ Receive reminders    [🔘 ON]│   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 📱 Install App               │   │
│  │ Add to home screen       >   │   │
│  └─────────────────────────────┘   │
│                                     │
│  Data & Sync                        │
│  ┌─────────────────────────────┐   │
│  │ 🔄 Sync Status               │   │
│  │ Last: 2 min ago          >   │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 🗑️ Clear Local Data          │   │
│  │ Remove cached data       >   │   │
│  └─────────────────────────────┘   │
│                                     │
│  About                              │
│  ┌─────────────────────────────┐   │
│  │ ℹ️ Version                   │   │
│  │ 1.0.0                        │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ ❓ Help & Support        >   │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 📜 Privacy Policy        >   │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🚪 Logout                    │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Setting Options:**

| Setting | What It Does |
|---------|--------------|
| **Language** | Change app language (22 options) |
| **Role** | Change your role (farmer, student, etc.) |
| **Organization** | Join or leave an organization |
| **Notifications** | Toggle push notifications |
| **Install App** | Add PWA to home screen |
| **Sync Now** | Force sync with server |
| **Clear Data** | Remove cached data |
| **Logout** | Sign out of the app |

---

### 15.2 Profile Page (`/profile`)

**What the user sees:**

```
┌─────────────────────────────────────┐
│  My Profile                         │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 👤 Full Name *               │   │
│  │ [Ramesh Kumar_______]        │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ ✉️ Email                     │   │
│  │ [ramesh@gmail.com] 🔒        │   │  ← Read-only
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 📞 Phone                     │   │
│  │ [9876543210_______] 🔒       │   │  ← Read-only if set
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🌍 Country                   │   │
│  │ [India ▼]                    │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🌐 Language                  │   │
│  │ [English ▼]                  │   │
│  └─────────────────────────────┘   │
│                                     │
│  Security                           │
│  ┌─────────────────────────────┐   │
│  │ 🔐 Change PIN            >   │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │        Save Changes          │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Change PIN Dialog:**

```
┌─────────────────────────────────────┐
│  Change PIN                         │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Current PIN                  │   │
│  │ [____]                       │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ New PIN                      │   │
│  │ [____]                       │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Confirm New PIN              │   │
│  │ [____]                       │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Cancel]           [Change PIN]    │
└─────────────────────────────────────┘
```

---

## 16. Admin Capabilities (Backend Only)

**Important:** Admin features are accessible only through the backend API or admin dashboard (not the PWA). The PWA is designed for farmers, extension workers, and field users.

### Admin Levels

RationSmart has two levels of administrative access:

| Admin Level | Access Scope | Typical Role |
|-------------|--------------|--------------|
| **Super Admin** | Full system access, all countries | Platform administrators |
| **Country Admin** | Access limited to their country's data | Country coordinators |

### Admin Capabilities Matrix

| Capability | Super Admin | Country Admin | Regular User |
|------------|:-----------:|:-------------:|:------------:|
| **User Management** |
| View all users | ✅ | ✅ (own country) | ❌ |
| Update user roles | ✅ | ✅ (own country) | ❌ |
| Deactivate users | ✅ | ✅ (own country) | ❌ |
| Assign admin level | ✅ | ❌ | ❌ |
| **Master Feed Database** |
| View master feeds | ✅ | ✅ | ✅ (read only) |
| Add master feeds | ✅ | ✅ (own country) | ❌ |
| Edit master feeds | ✅ | ✅ (own country) | ❌ |
| Delete master feeds | ✅ | ❌ | ❌ |
| **Feed Pricing** |
| View prices | ✅ | ✅ | ✅ (own country) |
| Update prices | ✅ | ✅ (own country) | ❌ |
| Bulk price import | ✅ | ✅ (own country) | ❌ |
| **Country & Region Management** |
| Add new countries | ✅ | ❌ | ❌ |
| Configure country settings | ✅ | ✅ (own country) | ❌ |
| Manage organizations | ✅ | ✅ (own country) | ❌ |
| **Taxonomy Management** |
| Manage breed lists | ✅ | ✅ (own country) | ❌ |
| Manage feed categories | ✅ | ✅ (own country) | ❌ |
| **Reports & Analytics** |
| System-wide reports | ✅ | ✅ (own country) | ❌ |
| Export data | ✅ | ✅ (own country) | ❌ |
| Usage statistics | ✅ | ✅ (own country) | ❌ |

### What Admins Manage

#### 1. User Management
- View list of all users in their scope
- Update user roles (farmer → extension_worker, etc.)
- Deactivate problematic accounts
- Super admin can promote users to country admin

#### 2. Master Feed Database
The master feed database contains standardized nutritional data for common feeds. Admins can:
- Add feeds with complete nutritional profiles (DM, CP, ME, NDF, Ca, P, etc.)
- Set country-specific availability
- Mark feeds as regional/seasonal

#### 3. Feed Pricing
Feed prices vary by region and time. Admins can:
- Set current prices per feed per region
- Bulk import prices from spreadsheets
- Track price history for reporting

#### 4. Organization Management
Organizations group users (e.g., dairy cooperatives, NGOs). Admins can:
- Create organizations
- Assign organization admins
- View organization-level reports

#### 5. Taxonomy Management
Taxonomies are predefined lists used throughout the app:
- **Breeds**: HF, Jersey, Gir, Sahiwal, etc. by country
- **Feed Categories**: Roughage, Concentrate, Mineral, etc.
- **Farming Types**: Dairy, Mixed, Crop

### Why No Admin Panel in PWA?

The PWA is optimized for field use:
1. **Mobile-first design** - Admin functions need larger screens
2. **Offline support** - Admin actions require immediate server sync
3. **Security** - Sensitive operations should be on controlled devices
4. **Complexity** - Admin UI would bloat the PWA

### Accessing Admin Functions

Admins access their tools through:
1. **Backend API** - Direct API calls with admin authentication
2. **Admin Dashboard** - Separate web application (future development)
3. **Database Console** - Direct database access for super admins

### API Endpoints (Reference)

For developers and admins using API directly:

```
Admin User Management:
GET  /api/v1/admin/users              - List users (with filters)
PUT  /api/v1/admin/users/:id/role     - Update user role
PUT  /api/v1/admin/users/:id/status   - Activate/deactivate user

Master Feeds:
GET  /api/v1/admin/feeds              - List all master feeds
POST /api/v1/admin/feeds              - Create master feed
PUT  /api/v1/admin/feeds/:id          - Update master feed
DEL  /api/v1/admin/feeds/:id          - Delete master feed

Feed Pricing:
GET  /api/v1/admin/prices             - List prices
PUT  /api/v1/admin/prices/bulk        - Bulk update prices

Reports:
GET  /api/v1/admin/reports/usage      - Usage statistics
GET  /api/v1/admin/reports/adoption   - Adoption metrics
GET  /api/v1/admin/exports/:type      - Export data
```

---

## Offline Behavior Summary

The app is designed to work offline. Here's what works when you have no internet:

| Feature | Offline Support | Notes |
|---------|----------------|-------|
| **View Cows** | ✅ Full | From local cache |
| **Add/Edit Cow** | ✅ Full | Syncs when online |
| **Log Milk** | ✅ Full | Syncs when online |
| **View Logs** | ✅ Full | From local cache |
| **View Feeds** | ✅ Full | From local cache |
| **Add Custom Feed** | ✅ Full | Syncs when online |
| **Get Diet** | ❌ No | Requires server calculation |
| **View Past Diets** | ✅ Full | From local cache |
| **Generate Report** | ❌ No | Requires server |
| **View Past Reports** | ✅ Partial | If previously downloaded |
| **Change Settings** | ✅ Partial | Syncs when online |
| **Login/Register** | ❌ No | Requires server |

**Sync Indicators:**
- 🔄 "Pending sync" - Data saved locally, waiting to upload
- ✅ "Synced" - Data saved to server
- ⚠️ "Sync failed" - Will retry automatically

---

## Navigation Structure

```
┌─────────────────────────────────────┐
│                                     │
│   [🏠 Home]  [🐄 Cows]  [📊 More]   │  ← Bottom navigation
│                                     │
└─────────────────────────────────────┘

Home (/)
├── Dashboard
├── Quick Actions → New Log, New Diet, Add Cow
├── Today's Logs
└── Recent Diets

Cows (/cows)
├── Cow List
├── Cow Detail → /cows/:id
├── Add Cow → /cows/new
└── Edit Cow → /cows/:id/edit

More (Drawer Menu)
├── Diet Plans → /diet
├── Milk Logs → /logs
├── Feeds → /feeds
├── Reports → /reports
├── Farmers → /farmers (Extension Workers only)
├── Yield History → /yields (Extension Workers only)
├── Settings → /settings
└── Profile → /profile
```

---

## Frequently Asked Questions (All Features)

**Q: Can I use the app without internet?**
A: Yes! Most features work offline. Diet optimization and reports require internet.

**Q: How do I know if my data is synced?**
A: Look for "Pending sync" labels on items. When synced, they disappear.

**Q: Can I have multiple cows?**
A: Yes, add as many cows as you have. Each cow has its own profile and logs.

**Q: What if I enter wrong milk data?**
A: You can edit any log. Tap the log and make changes.

**Q: How accurate is the diet optimization?**
A: It uses scientific formulas based on NRC requirements. Results depend on accurate cow data.

**Q: Can I share reports?**
A: Yes, download as PDF and share via any app.

**Q: How do I add a custom feed not in the list?**
A: Go to Feeds → My Feeds → Add Custom Feed. Enter nutritional values.

**Q: As an extension worker, how do I manage farmers?**
A: Use the Farmers section to add farmer profiles. You can then add cows and log data for them.

**Q: What happens if I delete a cow?**
A: The cow is archived, not permanently deleted. You can contact support to restore.

**Q: How often should I log milk?**
A: Ideally twice daily (morning and evening) for accurate tracking.

---

*Document last updated: February 2026*
