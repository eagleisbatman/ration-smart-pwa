# RationSmart PWA - Detailed User Flows

This document explains **exactly** what happens at each step when a user interacts with the app. Written for anyone to understand - no technical background required.

---

## Table of Contents

1. [New User Registration Flow](#1-new-user-registration-flow)
2. [Returning User Login Flow](#2-returning-user-login-flow)
3. [Onboarding Flow (After Registration)](#3-onboarding-flow-after-registration)
4. [Profile Setup Details](#4-profile-setup-details)
5. [What Gets Saved & Where](#5-what-gets-saved--where)

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
│  │  OR                         │   │
│  │                             │   │
│  │  ▼ Enter location manually  │   │
│  └─────────────────────────────┘   │
│                                     │
│  [← Back]          [Done ✓]         │
└─────────────────────────────────────┘
```

**After tapping "Share My Location":**

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
│                                     │
│  ▼ Enter location manually         │
│  ┌─────────────────────────────┐   │
│  │ Village: [_____________]    │   │
│  │ District: [_____________]   │   │
│  │ State: [_____________]      │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

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
A: You can skip it or enter your village/district/state manually.

**Q: What if I'm not affiliated with any organization?**
A: Select "Not Affiliated" in Step 3. You can join one later in Settings.

**Q: Is my PIN secure?**
A: Yes, PINs are encrypted before storage. We never store plain text PINs.

**Q: Can I use phone number instead of email?**
A: Yes! Toggle between Email and Phone on login/register screens.
