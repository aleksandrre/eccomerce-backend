# Carizma Backend — Project Status Report

**Last updated:** 2026-07-13
**Stack:** TypeScript, Node.js, Express 4, MongoDB (Mongoose 8), JWT, AWS S3, Multer, Nodemailer
**Scope of this pass:** Code-quality cleanup only — no new business domains (Orders/Checkout/Payments are a future phase). Endpoint **paths** were preserved; two **new cart endpoints** were added at the product owner's explicit request (see below).

---

## 1. Architecture overview

```
src/
├── index.ts                     # App bootstrap, route mounting, error handlers, DB connect
├── types/index.ts               # Shared domain interfaces
├── shared/
│   ├── config/env.ts            # Validated environment config (fail-fast at startup)
│   ├── errors/                  # AppError class + ErrorCode catalog
│   ├── middlewares/             # auth, isAdmin, errorHandler, notFoundHandler
│   ├── models/                  # UserModel, RefreshTokenModel, localizedStringSchema
│   ├── factories/               # productReadFactory, productAdminFactory, categoryAdminFactory
│   ├── services/                # s3Service, configureMulter
│   └── utils/                   # asyncHandler, apiResponse, validators, pricing, lang, authUtils, emailUtils
└── modules/
    ├── auth/     (auth + email controllers/routes)
    ├── food/     (product model, category model, public + admin controllers/routes)
    ├── animal/   (same shape as food)
    ├── cart/
    ├── user/
    ├── faq/
    ├── question/
    └── subscription/
```

The API is **trilingual** (`en`, `ka`, `ru`). Product/category/FAQ content is stored as `{ en, ka, ru }` objects and localized on read via the `?lang=` query param (default `en`).

---

## 2. What is done and working (by module)

| Module | Capabilities | Status |
|---|---|---|
| **auth** | Login, refresh token, logout, change password | ✅ Working |
| **auth/email** | Registration + email verification, forgot/reset password | ✅ Working |
| **food** (products) | Public: list/one/by-category/categories. Admin: CRUD products + categories, image upload to S3 | ✅ Working |
| **animal** (products) | Same as food, with percentage-sale pricing | ✅ Working |
| **cart** | View, add, set absolute qty, decrement, remove line, clear — with **live pricing** | ✅ Working |
| **user** | Get/update profile | ✅ Working |
| **faq** | Public list; admin manage FAQ types & questions | ✅ Working |
| **question** | Public submit; admin list/delete-all | ✅ Working |
| **subscription** | Public email/phone subscribe; admin list subscribers | ✅ Working |

Authentication: short-lived JWT access token + long-lived refresh token (stored server-side with a TTL). Admin routes are guarded by `authenticateToken` + `isAdmin`.

---

## 3. What was changed in this cleanup (and why)

### 3.1 Centralized error handling (removed ~25 duplicated try/catch blocks)
- **New:** `shared/errors/AppError.ts`, `shared/errors/errorCodes.ts`, `shared/middlewares/errorHandler.ts`, `shared/utils/asyncHandler.ts`.
- Controllers now `throw AppError(...)` and are wrapped in `asyncHandler` at the route layer. One middleware converts **everything** (AppError, Mongoose `ValidationError`/`CastError`, duplicate-key `11000`, Multer errors, unexpected errors) into the standard error envelope.
- **Why:** every controller previously repeated identical try/catch and inconsistent 500 payloads; several leaked raw `error.message` to clients (information disclosure). Now internal errors are logged and hidden.

### 3.2 Standard response envelope + machine-readable error codes
- **New:** `shared/utils/apiResponse.ts` (`sendSuccess`). Every success is `{ success, data, message }`; every error is `{ success, code, message }`.
- **Why:** responses previously came in four different shapes (`{error}`, `{message}`, `{success,message,data}`, `{message,data}`). The frontend now has one contract and can switch on stable `code`s. Full catalog in `API_DOCUMENTATION.md`.

### 3.3 De-duplicated the Food/Animal modules
- **New factories:** `productReadFactory` (identical public read endpoints), `categoryAdminFactory` (identical category create/delete), `productAdminFactory` (shared create/update/delete; per-type fields injected via config).
- `localizedStringSchema` was copy-pasted in 5 models → now a single `shared/models/localizedStringSchema.ts`.
- **Why:** food and animal controllers were ~90% identical. The modules now differ only in their type-specific fields and pricing.

### 3.4 Validation (previously scattered / missing)
- **New:** `shared/utils/validators.ts` — `requireFields`, `assertValidEmail`, `assertStrongPassword`, `parseNumber` (min/max/integer), `parseLocalizedField`.
- Registration now enforces a **valid email + strong password** (previously unvalidated). Cart operations validate quantity, min-order, stock, and integer-vs-fractional rules. Product creation validates all numeric fields and requires at least one image.
- **Why:** validation was inconsistent — `changePassword` enforced a strong password but registration accepted anything.

### 3.5 Live cart pricing (per product-owner decision)
- `priceSnapshot` is no longer a frozen value. `shared/utils/pricing.ts` (`computeFoodUnitPrice`, `computeAnimalUnitPrice`) is the single source of truth. Prices are recomputed live on **add, set-quantity, decrement, and on every cart view**.
- Cart totals are computed in the controller with correct **savings** (`cartOriginalTotal - cartTotal`).
- **Why:** the old `cartSavings` virtual was always `0` (both totals read the same `priceSnapshot`). Also fixed the bug where a food line dropping below `kgThreshold` didn't re-price.
- **Future checkout note (recorded here as required):** the checkout/payment module MUST re-verify and recompute the final price **server-side** at the moment payment is initiated — never trust a client-supplied or previously stored price.

### 3.6 Cart quantity management — 4 mechanisms
- `POST /cart/add` (`+=`, unchanged semantics) · `DELETE /cart/remove` (`-1`, unchanged + price-recalc fix) · **NEW** `PUT /cart/set-quantity` (absolute set) · **NEW** `DELETE /cart/remove-item` (delete whole line) · `DELETE /cart/clear`.
- The two new routes are the **only** additive endpoints; all pre-existing paths are unchanged.

### 3.7 Security fixes
- Auth middleware returned invalid HTTP codes `330`/`331` → now `401` with codes `TOKEN_MISSING`/`TOKEN_INVALID`.
- `GET /auth/token` → `POST /auth/token` (GET request bodies are unreliable).
- `forgot-password` no longer reveals whether an email exists (generic `200` always) — prevents account enumeration.
- `User.password` is now `select:false`; only `login`/`changePassword` load it via `.select("+password")`.
- Refresh tokens now have a **7-day TTL index** so abandoned sessions self-clean.
- Removed `tls: { rejectUnauthorized: false }` from Nodemailer (it disabled certificate validation).
- Multer now restricts uploads to image MIME types.
- Env vars are validated once at startup (`shared/config/env.ts`); a missing var exits with a clear message instead of a cryptic runtime crash.

### 3.8 Consistency / TypeScript
- All API messages and code comments standardized to **English** (were mixed Georgian/English). Model-level validation messages translated too.
- Removed dead code: `downloadFileFromS3` (unused), phantom `discountedPrice` field on the cart-item type, and the misleading always-zero user cart virtuals.
- Reduced `as never` casts; localized-content field lists centralized.

### 3.9 Behavior fix: `isNewProduct`
- Multipart form fields arrive as strings. The old `Boolean(isNewProduct)` turned the string `"false"` into `true`. Now parsed strictly: only `true`/`"true"` → `true`.

### 3.10 Cascading category delete (destructive)
- `deleteCategory` in `shared/factories/categoryAdminFactory.ts` now cascade-deletes the category's products and their S3 images, returning `deletedProductsCount`.
- **Safety:** DB writes run inside a **transaction** when the server supports it (atomic all-or-nothing). On standalone MongoDB (no transactions) it falls back to a safe **sequential** order — products first, then the category — so a mid-way failure can never leave products with a dangling category reference. S3 image cleanup runs only **after** the DB delete commits (best-effort; orphaned files never fail an already-committed delete).
- **Why:** requested by the product owner; also resolves the previously-documented orphaned-product data-integrity issue.

---

## 4. ⚠️ Breaking changes the frontend must adopt

1. **All responses** are now `{ success, data, message }` (success) or `{ success, code, message }` (error). Payloads that used to be at the top level are now under `data`.
2. **`POST /auth/token`** (was `GET`). Refresh token still in the JSON body: `{ "token": "<refreshToken>" }`.
3. **Auth failures** now return `401` (were the invalid codes `330`/`331`).
4. **`POST /email/forgot-password`** always returns `200` (never `404`), even for unknown emails.
5. **Empty lists** (product categories, FAQ) return `200` with `data: []` (were `404`).
6. **Product create/update** (multipart): `name` and `description` must be sent as **JSON strings**, e.g. `name='{"en":"..","ka":"..","ru":".."}'`.
7. **New cart routes:** `PUT /cart/set-quantity`, `DELETE /cart/remove-item`.
8. **Cart response shape changed** — each line now returns `unitPrice`, `originalUnitPrice`, `totalPrice`, `available`; top-level `cartTotal`, `cartOriginalTotal`, `cartSavings`. Prices are live.
9. **Animal product `quantity`** must be a whole number (packages); **food `quantity`** may be fractional (kg).
10. Registration now rejects weak passwords / invalid emails with `INVALID_PASSWORD` / `VALIDATION_ERROR`.
11. **⚠️ Category delete is now a CASCADING, destructive action.** `DELETE /admin/{food,animal}/categories/:categoryId` deletes the category **and every product in it** (plus those products' S3 images), and returns `data: { deletedProductsCount: N }`. **The frontend must add a confirmation warning to the category-delete button** (e.g. *"This will delete the category and all products in it — are you sure?"*) before calling it. Previously this endpoint deleted only the category and left products orphaned.

---

## 5. Issues found but intentionally NOT changed (and why)

- **Cart `refPath` mismatch.** The cart schema's `refPath: "cart.productType"` points at values (`food`/`animal`) that aren't model names, so Mongoose `.populate()` on the cart never worked. Rather than change the schema/enum (which would alter the API's `productType` values), the cart controller now does **manual population** grouped by type. The dead `refPath` is left in place; removing/replacing it is a future cleanup.
- **Customer email bodies remain in Georgian** (`emailUtils.ts`). These are end-user emails for a Georgian audience, not API messages, so they were left as-is.
- **`?lang` not applied to cart product names.** Cart line `product.name` is returned as the raw `{en,ka,ru}` object so the client can localize; not changed to avoid guessing the desired shape.
- **No pagination** on list endpoints (products, questions, subscribers). Out of scope for a pure cleanup; noted below as debt.
- **Access-token lifetime** changed from the magic `22760s` to a configurable `6h` (`ACCESS_TOKEN_TTL`). Functionally negligible (~19 min shorter); flagged in case any client hard-codes expiry.

---

## 6. Remaining work for a complete e-commerce backend (prioritized)

**P0 — Core commerce (next phase)**
1. **Orders / Checkout** — order model, server-side price re-verification (see §3.5), stock decrement on order placement, order history.
2. **Payments** — payment provider integration, webhooks, idempotency.
3. **Stock reservation strategy** — decide when stock is decremented (currently cart never touches stock).

**P1 — Hardening**
4. **Automated tests** — none exist. Add unit tests (pricing, validators) + integration tests (auth, cart, admin) with Jest + supertest + mongodb-memory-server.
5. **Rate limiting** on auth endpoints (`login`, `forgot-password`, `registration`) via `express-rate-limit`.
6. **Security headers** via `helmet`; restrict **CORS** to known origins.
7. **Schema validation library** — migrate the internal validators to **Zod** for declarative, reusable request schemas.
8. **Hash email/reset tokens** before storing (currently stored in plaintext).

**P2 — Product/ops**
9. **Pagination + filtering + sorting** on product/question/subscriber lists.
10. **Structured logging** (pino/winston) + centralized error monitoring (Sentry).
11. **CI/CD + deployment config**, health-check endpoint, Dockerfile.
12. **Order confirmation / transactional emails.**

---

## 7. Known technical debt

- Tests: **0% coverage.**
- `.populate()` for the cart is unusable due to the `refPath` design (worked around manually).
- Transactions are used for cascading category delete (with a sequential fallback), but other multi-step writes (e.g. product ↔ category membership sync on create/update/move) are still not atomic.
- No pagination — list endpoints will not scale.
- Validation is hand-rolled (adequate but not declarative).
- `package.json` name is still the scaffold default `"authentication"`.
- S3 image cleanup is best-effort (no verification the delete succeeded before DB write).
- No request logging / observability.
