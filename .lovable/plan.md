

## Implementation Plan: Admin Branding + Agent Authorization

### 1. Database Migration

Create in a single migration:

- **`app_role` enum**: `('admin', 'user')`
- **`user_roles` table**: `id`, `user_id` (FK to auth.users), `role` (app_role), unique constraint on (user_id, role). RLS: admins only via `has_role()`.
- **`has_role()` function**: Security definer function to check roles without RLS recursion.
- **`app_settings` table**: Single-row table with columns: `id` (default 1, constrained), `app_name`, `tagline`, `logo_url`, `favicon_url`, `primary_color`, `secondary_color`, `accent_color`, `font_display`, `font_body`, `login_message`. RLS: SELECT for everyone, INSERT/UPDATE for admins only. Seed with defaults.
- **Add `status` column to `profiles`**: `text DEFAULT 'pending'`, values: `pending`, `approved`, `rejected`.
- **Storage bucket**: `app-assets` for logo/favicon uploads.

### 2. New Files

**`src/pages/Admin.tsx`** — Admin panel with two tabs:
- **Branding**: App name, tagline, logo upload, favicon upload, color pickers (primary/secondary/accent), font selectors (display + body), login message. Save updates `app_settings`.
- **Agents**: Table of all profiles (requires admin SELECT policy on profiles). Show name, email, agency, status, join date. Approve/reject/revoke buttons update `profiles.status`.

**`src/hooks/useAppSettings.ts`** — Fetches `app_settings` row, returns branding values. Uses React Query for caching. Provides CSS variable object and metadata (app name, logo, etc.).

**`src/components/PendingApproval.tsx`** — Simple full-page message: "Your account is pending approval. You'll be notified when approved."

### 3. Modified Files

**`src/App.tsx`**:
- Add `/admin` route
- Wrap app with `useAppSettings` to apply global CSS variables

**`src/pages/Auth.tsx`**:
- Fetch `app_settings` to show custom logo, app name, tagline, colors
- After login, check `profiles.status` — redirect to pending screen if not approved

**`src/hooks/useAuth.ts`**:
- After auth state change, fetch profile status
- If `pending` or `rejected`, expose status so pages can react

**`src/pages/Dashboard.tsx`**:
- Check profile status, show PendingApproval if not `approved`
- Show app name from settings in header
- Add admin link if user has admin role

**`src/pages/ClientView.tsx`**, **`src/pages/Approve.tsx`**, **`src/pages/Revisions.tsx`**:
- Replace `useBrandStyles` with `useAppSettings` for global branding

### 4. RLS Policies Summary

| Table | Policy | Rule |
|-------|--------|------|
| `user_roles` | SELECT/INSERT/UPDATE/DELETE | `has_role(auth.uid(), 'admin')` |
| `app_settings` | SELECT | everyone (anon + authenticated) |
| `app_settings` | INSERT/UPDATE | `has_role(auth.uid(), 'admin')` |
| `profiles` | SELECT (new) | admins can view all profiles |

### 5. Admin Bootstrap

After migration, I will prompt you to sign up, then insert your user ID into `user_roles` with role `admin` and set your profile status to `approved`.

### 6. Storage

Create `app-assets` bucket (public) for logo and favicon uploads. Admin page uses Supabase storage upload.

