# Page: /auth/signin

**URL:** `https://dashboard-manhar.ticmint.com/auth/signin`  
**Meta Description:** "Create your first event for free. Dive right in and discover the ease of our platform without any upfront costs."  
**Canonical:** Not explicitly set (dynamic via DynamicFavicon/IconMark components)

---

## HTML Structure

```
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="Create your first event for free. Dive right in and discover the ease of our platform without any upfront costs." />
    <link rel="icon" />  <!-- DynamicFavicon component -->
  </head>
  <body>
    <!-- Global Providers (loaded on every page): -->
    <!-- 1. UTMCapture -->
    <!-- 2. AttributionInitializer -->
    <!-- 3. AnalyticsBootstrap -->
    <!-- 4. MixpanelRouteTracker -->
    <!-- 5. Providers (auth, react-query, etc.) -->
    <!-- 6. DynamicFavicon -->
    <!-- 7. FreshchatWidget -->
    <!-- 8. MixpanelIdentify -->
    <!-- 9. ClientSegmentRoot -->
    <!-- 10. Toaster (toast notifications) -->
    
    <!-- Page Content (rendered client-side): -->
    <AuthSignInPage />
  </body>
</html>
```

---

## Auth Flow State Machine

The sign-in page implements a multi-step flow managed by a Zustand store:

### States
1. **email** → Welcome screen, enter email
2. **verify** → OTP or Password entry
3. **organization** → Select organization (only if multiple orgs)

### Auth Methods
- `"otp"` — One-time password via email
- `"password"` — Traditional password

### Flow Diagram
```
[Welcome Screen] → email entered → [Backend Check]
  ├─ New user → Redirect to signup (embedded)
  ├─ Existing user, password set → [Password Screen]
  ├─ Existing user, no password → [OTP Screen]
  └─ Multiple organizations → [Org Selection Screen]
```

---

## Screens & Components

### Screen 1: Welcome / Email Entry

**Heading:**
- H2: "Welcome!"

**Body Copy:**
- "Enter your email to sign in or sign up."

**Form Fields:**
| Field | Type | Label | Placeholder | Validation |
|-------|------|-------|-------------|------------|
| email | email | "Email" | — | `z.string().email("Please enter a valid email address")` |

**CTAs:**
| Button | Text | Style |
|--------|------|-------|
| Primary | "Continue" | Primary button |

---

### Screen 2: Password Entry

**Heading:**
- "Sign In"

**Form Fields:**
| Field | Type | Label | Placeholder | Validation |
|-------|------|-------|-------------|------------|
| password | password (with show/hide toggle) | "Password" | — | `z.string().min(1, "Password is required")` |

**CTAs:**
| Button | Text | Style |
|--------|------|-------|
| Primary | "Sign In" | Primary button (loading: "Signing in...") |
| Secondary (link) | "Sign in with a code" | Switches to OTP method |

**Icons:** Eye / EyeOff (password visibility toggle)

---

### Screen 3: OTP Entry

**Heading:**
- "Enter the code sent to {email}"

**Form Fields:**
| Field | Type | Label | Validation |
|-------|------|-------|------------|
| otp | 6-digit OTP input (InputOTP component) | — | `z.string().min(6, "Please enter a valid OTP").max(6, "Please enter a valid OTP")` |

**CTAs:**
| Button | Text | Style |
|--------|------|-------|
| Primary | "Continue" | Primary button (loading: "Verifying...") |
| Secondary (link) | "Resend code" | Disabled during cooldown: "Resend code in {P}s" |
| Back link | "Use a different email" | Returns to email screen |

**OTP Input Component:**
- Uses `InputOTP`, `InputOTPGroup`, `InputOTPSlot`, `InputOTPSeparator`
- 6 slots separated into groups (e.g., 3-3 or 3-2-1)

---

### Screen 4: Organization Selection

**Heading:**
- "Select Organisation"

**Content:**
- Radio/list selection of organizations associated with the user's email

**CTAs:**
| Button | Text | Style |
|--------|------|-------|
| Primary | "Continue" | Primary button |

---

## Error Messages

| Error | Message Text |
|-------|--------------|
| Invalid credentials | "Invalid email or password. Please try again." |
| Invalid OTP | "Invalid code. Please try again." |
| No organizations | "No organizations found for this account." |
| Session expired | "Session expired. Please sign in again." |

---

## Footer / Legal Text

**Text:**
- "By clicking continue, you agree to [Terms of Service](https://ticmint.com/terms/) and [Privacy Policy](https://ticmint.com/privacy-policy/)."

---

## Branding

- `BrandLogo` component — supports white-labeling via `useWhiteLabel()` hook
- Brand asset files: `brand-logo.svg`, `brand-logo-sm.svg`, `brand-logo-white.svg`

---

## API Endpoints (React Query hooks — "DashboardAuthController")

| Hook | Method | Purpose |
|------|--------|---------|
| `verifyEmail` | POST | Check if email exists, determine auth method |
| `verifyPassword` | POST | Authenticate with email + password |
| `sendOtp` | POST | Send OTP to email |
| `verifyOtp` | POST | Validate OTP code |
| `selectOrganization` | POST | Select organization after multi-org login |

**Response shapes:**
- Login success: `{ status: "success", data: { token: "..." } }`
- Multi-org: `{ status: "success", data: { tempToken: "...", organizations: [...] } }`
- Error: HTTP 401

---

## Authentication Library

- **next-auth** with `"token"` strategy
- `signIn("token", { token, redirect: false })`
- Post-auth redirect: `callbackUrl` query param, or default `/`

---

## Analytics / Tracking

- **Mixpanel:** RouteTracker + Identify (loaded globally)
- **UTM Capture:** UTMCapture component
- **Attribution:** AttributionInitializer component
