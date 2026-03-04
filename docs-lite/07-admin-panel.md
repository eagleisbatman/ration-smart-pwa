# Admin Panel

## Access

Users with `admin_level` set to `super_admin`, `country_admin`, or `org_admin` see an "Admin" link in the navigation drawer. Route: `/admin`.

## Admin Dashboard (`/admin`)

### Simulation Stats (Super Admin Only)
- Total simulations, success rate, recommendation/evaluation counts
- Country breakdown table (collapsible)
- Data from `GET /admin/simulation-stats`

### Quick Action Cards (5 cards)
1. **Manage Users** → `/admin/users`
2. **Feed Management** → `/admin/feeds`
3. **Feedback** → `/admin/feedback`
4. **Reports** → `/admin/reports`
5. **Simulation Stats** → summary display

## User Management (`/admin/users`)

- Paginated user list with search
- Set admin level (user / org_admin / country_admin / super_admin)
- Toggle user active/inactive
- Backend: `GET /admin/users`, `PUT /admin/users/:id/set-admin-level`

## Feed Management (`/admin/feeds`)

- Search + paginated feed list
- Add / Edit / Delete individual feeds
- Bulk Upload (Excel file)
- Export feeds to Excel
- Backend endpoints: `GET /admin/list-feeds`, `POST /admin/add-feed`, `PUT /admin/update-feed/:id`, `DELETE /admin/delete-feed/:id`, `POST /admin/bulk-upload-feeds`, `GET /admin/export-feeds`

## Feedback (`/admin/feedback`)

- Stats card: total responses, average rating, rating distribution (1-5 stars)
- Scrollable list of all feedback entries with user name, rating, type badge, text, date
- Backend: `GET /admin/user-feedback/all`, `GET /admin/user-feedback/stats`

## Reports (`/admin/reports`)

- Paginated list of all saved reports
- Shows: report name/ID, user name, report type (rec/eval), date
- PDF download button for reports with `bucket_url`
- Backend: `GET /admin/get-all-reports/`

## Store

All admin actions are in `src/stores/admin.ts`. Every action passes `admin_user_id` as a query parameter for authorization.

## API Adapter Mappings

All admin endpoints are mapped in `src/services/api-adapter.ts` under the `ADMIN ENDPOINTS` section:

```
/api/v1/admin/list-feeds        → /admin/list-feeds
/api/v1/admin/add-feed          → /admin/add-feed
/api/v1/admin/update-feed/:id   → /admin/update-feed/:id
/api/v1/admin/delete-feed/:id   → /admin/delete-feed/:id
/api/v1/admin/bulk-upload-feeds → /admin/bulk-upload-feeds
/api/v1/admin/export-feeds      → /admin/export-feeds
/api/v1/admin/user-feedback/all → /admin/user-feedback/all
/api/v1/admin/user-feedback/stats → /admin/user-feedback/stats
/api/v1/admin/get-all-reports   → /admin/get-all-reports/
/api/v1/admin/simulation-stats  → /admin/simulation-stats
```
