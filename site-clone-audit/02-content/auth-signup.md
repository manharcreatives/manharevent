# Page: /auth/signup

**URL:** `https://dashboard-manhar.ticmint.com/auth/signup`  
**Meta Description:** "Create your first event for free. Dive right in and discover the ease of our platform without any upfront costs."

---

## Behavior

The signup page component performs an automatic redirect to `/auth/signin` via:
```js
useRouter().replace("/auth/signin")
```

The sign-up form is **embedded within the sign-in flow** at `/auth/signin`. When a new email is entered that doesn't exist in the system, the flow transitions to the signup form.

---

## Signup Form Fields (embedded in signin flow)

### Form Schema (Zod)

| Field | Type | Validation Rules |
|-------|------|------------------|
| firstName | text | `z.string().min(2, "First name must be at least 2 characters")` |
| lastName | text | `z.string().min(2, "Last name must be at least 2 characters")` |
| email | email | `z.string().email("Invalid email address")` |
| password | password | Min 8 chars, must contain uppercase, lowercase, number, and special character |
| confirmPassword | password | Must match password — `z.refine()` — "Passwords don't match" |

### Password Validation Rules
1. "Password must be at least 8 characters"
2. "Password must contain at least one uppercase letter"
3. "Password must contain at least one lowercase letter"
4. "Password must contain at least one number"
5. "Password must contain at least one special character"

### Form Behavior
- Validation runs on blur per field
- Enter key triggers `requestSubmit()`

---

## Limitations

> **NOTE:** The signup page is only accessible from within the signin flow (as a new-user path). The `/auth/signup` standalone URL simply redirects to `/auth/signin`. The exact visual layout and additional signup-specific UI elements could not be extracted because they render client-side only.
