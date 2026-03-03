# RationSmart Lite — Test Cases

**Live URL**: https://rs-lite-production.up.railway.app
**Backend**: https://ration-smart-backend.up.railway.app
**Last updated**: 2026-03-03

---

## T1: Authentication

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| T1.1 | Login (India) | Phone: +919900004444, PIN: 1111 | Login success, redirected to home |
| T1.2 | Login (Kenya) | Phone: +254700001111, PIN: 1111 | Login success (if test user exists) |
| T1.3 | Login (Bangladesh) | Phone: +8801700001111, PIN: 1111 | Login success (if test user exists) |
| T1.4 | Login (Ethiopia) | Phone: +251900001111, PIN: 1111 | Login success (if test user exists) |
| T1.5 | Wrong PIN | Phone: +919900004444, PIN: 9999 | Error message shown |
| T1.6 | Session persistence | Login, close tab, reopen | Still logged in |
| T1.7 | Logout | Tap menu → Logout | Redirected to login page |

---

## T2: Home Page

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| T2.1 | Home renders | After login | See greeting, "Start New Simulation" card |
| T2.2 | Start simulation | Tap "Start New Simulation" | Navigate to /cattle-info |
| T2.3 | Recent simulations | After running a simulation, go home | See recent simulation in list |
| T2.4 | Empty state | Fresh user, no history | "Run your first simulation" message |

---

## T3: Cattle Info Form

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| T3.1 | Fill form (India dairy) | Breed: HF Crossbred, Weight: 400kg, Milk: 15L, Lactation: Mid | All fields accept input |
| T3.2 | Fill form (Kenya dairy) | Breed: Friesian, Weight: 450kg, Milk: 20L | All fields accept input |
| T3.3 | Fill form (Bangladesh) | Breed: Local, Weight: 250kg, Milk: 5L | All fields accept input |
| T3.4 | Fill form (Ethiopia) | Breed: Local, Weight: 300kg, Milk: 8L | All fields accept input |
| T3.5 | Low-milk heifer | Weight: 280kg, Milk: 0L, Not lactating | Form accepts non-lactating cow |
| T3.6 | High-producer | Weight: 550kg, Milk: 35L, Early lactation | Form accepts extreme values |
| T3.7 | Proceed to feeds | Fill form → tap Continue | Navigate to /feed-selection |

---

## T4: Feed Selection (Multi-Country)

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| T4.1 | India feeds load | Select India as country | See Indian feed list (Bajra, Rice Bran, etc.) |
| T4.2 | Kenya feeds load | Select Kenya as country | See Kenyan feed list (Napier Grass, Dairy Meal, etc.) |
| T4.3 | Bangladesh feeds load | Select Bangladesh | See Bangladeshi feeds |
| T4.4 | Ethiopia feeds load | Select Ethiopia | See Ethiopian feeds |
| T4.5 | Select balanced diet | Pick 6-8 feeds: 2 forages + 3 concentrates + 1 mineral | All selected, quantities editable |
| T4.6 | Select only forages | Pick only 3 forages, no concentrates/minerals | Should be allowed (may produce infeasible) |
| T4.7 | Custom feed price | Change price of a feed | Price updates, reflected in cost calc |
| T4.8 | Proceed to optimize | Select feeds → tap "Generate Recommendation" | Loading state → navigates to report |

---

## T5: Recommendation Report (Success)

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| T5.1 | Report renders | After successful optimization | See Solution Summary card |
| T5.2 | Daily cost shown | Check Solution Summary | Non-zero cost in local currency |
| T5.3 | DM intake shown | Check Solution Summary | Non-zero DM intake (kg) |
| T5.4 | Feed breakdown table | Scroll to feed list | Table with feed names, quantities, costs |
| T5.5 | Feed quantities non-zero | Check feed breakdown | At least 1 feed with quantity > 0 |
| T5.6 | Diet status badge | Check StatusCard | "OPTIMAL" or "MARGINAL" (not "UNKNOWN") |
| T5.7 | Methane metrics | Scroll to Environmental Impact | Non-zero methane values (g/day) |
| T5.8 | Warnings shown | If any warnings | Warning cards with text |
| T5.9 | New Case button | Tap "New Case" | Returns to home page |

---

## T6: Recommendation Report (Infeasible)

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| T6.1 | Infeasible banner | Select only 2-3 poor feeds → optimize | Orange "No feasible diet found" banner |
| T6.2 | Hint text | Check infeasible banner | "Try adding more feed variety" message |
| T6.3 | Change Feeds button | Tap "Change Feeds" | Navigate back to /feed-selection |
| T6.4 | No feed table shown | Check below banner | Feed breakdown NOT visible |
| T6.5 | No methane shown | Check below banner | Methane section NOT visible |

---

## T7: Multi-Country Optimization

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| T7.1 | India full flow | Login IN user → cattle → India feeds (balanced) → optimize | Valid diet, non-zero cost in INR |
| T7.2 | Kenya full flow | Login KE user → cattle → Kenya feeds (balanced) → optimize | Valid diet, cost in KES |
| T7.3 | Bangladesh full flow | Login BD user → cattle → BD feeds → optimize | Valid diet, cost in BDT |
| T7.4 | Ethiopia full flow | Login ET user → cattle → ET feeds → optimize | Valid diet, cost in ETB |
| T7.5 | Cross-country feed quality | Compare India vs Kenya diet costs | Both produce reasonable results |

---

## T8: Simulation History

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| T8.1 | Save on generate | Run a recommendation | Simulation saved to history |
| T8.2 | History shows entry | Open history dialog | See the recent simulation |
| T8.3 | Entry details | Check history item | Shows breed, weight, date, type |
| T8.4 | Restore simulation | Tap a history item | Cattle info pre-filled, navigate to form |

---

## T9: UI/UX

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| T9.1 | Dark mode | Toggle dark mode in settings | All sections readable, no invisible text |
| T9.2 | Language switch | Switch to Hindi/Swahili/Bengali | Labels change to selected language |
| T9.3 | RTL language | Switch to Arabic (if available) | Layout flips correctly |
| T9.4 | Mobile responsive | View on 375px width | All cards stack, no overflow |
| T9.5 | Back navigation | Use browser back button | Correct page shown |
| T9.6 | Loading states | During optimization | Spinner/loading indicator visible |

---

## T10: Edge Cases & Error Handling

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| T10.1 | Network error | Disable network during optimization | Error message shown, not blank page |
| T10.2 | Empty feed selection | Try to optimize with 0 feeds | Prevented or clear error |
| T10.3 | Extreme values | Weight: 1000kg, Milk: 50L | No crash, reasonable result or clear error |
| T10.4 | Refresh on report | Refresh browser on report page | Handles gracefully (redirects or re-renders) |
| T10.5 | Direct URL access | Go directly to /recommendation-report | Shows "no data" state, not crash |

---

## Priority for Live Testing

1. **T7.1** — India full flow (primary market)
2. **T5.1-T5.8** — Report rendering validation
3. **T6.1-T6.5** — Infeasible diet handling
4. **T7.2-T7.4** — Multi-country flows
5. **T1.1** — Authentication
6. **T2.1-T2.2** — Home page
7. **T8.1-T8.2** — Simulation history
8. **T9.1-T9.4** — UI polish
