# Protected Pages (require authentication)

**Note:** All content below is inferred from code analysis. Actual visual content could not be extracted because all protected routes redirect to `/auth/signin` without valid credentials.

---

## /dashboard

**URL:** `https://dashboard-manhar.ticmint.com/dashboard`  
**Purpose:** Main authenticated landing page after login  
**Content:** Could not be extracted (auth wall)

---

## /events

**URL:** `https://dashboard-manhar.ticmint.com/events`  
**Purpose:** Event listing and management  
**Content:** Could not be extracted (auth wall)

---

## /pricing

**URL:** `https://dashboard-manhar.ticmint.com/pricing`  
**Purpose:** Subscription plans and pricing  
**Content:** Could not be extracted (auth wall)

---

## /settings

**URL:** `https://dashboard-manhar.ticmint.com/settings`  
**Purpose:** User and organization settings  
**Content:** Could not be extracted (auth wall)

---

## /team

**URL:** `https://dashboard-manhar.ticmint.com/team`  
**Purpose:** Team member management  
**Content:** Could not be extracted (auth wall)

---

## Additional Inferred Pages

Based on library usage in the JS bundles:

| Library | Suggests Feature |
|---------|-----------------|
| `react-grid-layout` | Dashboard with draggable/resizable widget panels |
| `tiptap` (rich text editor) | Event description/content editing |
| `KaTeX` | Math/LaTeX formula rendering |
| `react-tweet` | Embedded Twitter/X tweet display |
| `InputOTP` | OTP verification screens |

---

> **ACTION REQUIRED:** To extract full content from protected pages, authenticated access (valid login credentials or API tokens) is needed. Alternatively, access the source code repository directly.
