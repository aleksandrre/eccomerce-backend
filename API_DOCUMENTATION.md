# Carizma API Documentation

Frontend-ready reference for the Carizma pet-store backend. Every route below is verified against the current controller/route code.

- **Base URL:** `{BASE_URL}` (e.g. `http://localhost:3001`)
- **Content types:** `application/json` for all endpoints **except** product create/update, which use `multipart/form-data`.
- **Localization:** content endpoints accept `?lang=en|ka|ru` (default `en`).

---

## 1. Conventions

### 1.1 Authentication
Protected endpoints require:

```
Authorization: Bearer <accessToken>
```

- **public** — no token.
- **authenticated** — any logged-in user.
- **admin** — logged-in user with `isAdmin: true`.

Access tokens are short-lived (default 6h). Use `POST /auth/token` with the refresh token to get a new access token.

### 1.2 Standard response envelope

**Success** — HTTP `2xx`:
```json
{ "success": true, "data": { }, "message": "Human-readable English message" }
```
`data` is the payload (object, array, or `null`). `message` defaults to `"OK"` when not otherwise specified.

**Error** — HTTP `4xx`/`5xx`:
```json
{ "success": false, "code": "STABLE_CODE", "message": "Human-readable English message" }
```
Switch on `code` for UI behavior; display or map `message` as needed.

### 1.3 Error code catalog

| `code` | Typical HTTP | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Missing/invalid field, bad number, bad file type, etc. |
| `UNAUTHORIZED` | 401 | Auth required or failed (generic) |
| `TOKEN_MISSING` | 401 | No/malformed Authorization or refresh token |
| `TOKEN_INVALID` | 401/403 | Token failed verification, or expired verify/reset token |
| `INVALID_CREDENTIALS` | 401 | Wrong email/password on login |
| `EMAIL_NOT_VERIFIED` | 401 | Login blocked until email is verified |
| `INVALID_PASSWORD` | 400 | Password fails strength rules |
| `PASSWORDS_DO_NOT_MATCH` | 400 | `newPassword` ≠ `newPasswordRepeat` |
| `SAME_PASSWORD` | 400 | New password equals old |
| `INCORRECT_OLD_PASSWORD` | 400 | Old password wrong on change-password |
| `EMAIL_EXISTS` | 409 | Email already registered |
| `NUMBER_EXISTS` | 409 | Phone number already registered |
| `FORBIDDEN` | 403 | Admin privileges required |
| `NOT_FOUND` | 404 | Generic resource / user / FAQ not found |
| `PRODUCT_NOT_FOUND` | 404 | Product does not exist |
| `CATEGORY_NOT_FOUND` | 400/404 | Category does not exist |
| `CART_ITEM_NOT_FOUND` | 404 | Line not in cart |
| `INSUFFICIENT_STOCK` | 400 | Requested quantity exceeds stock |
| `BELOW_MIN_KG` | 400 | Food quantity below product's `minKg` |
| `CONFLICT` | 409 | Duplicate unique key (generic) |
| `DUPLICATE_SUBSCRIPTION` | 409 | Email/phone already subscribed |
| `INTERNAL_ERROR` | 500 | Unexpected server error (details hidden) |

### 1.4 Localization behavior
- **Read** endpoints (products, categories, FAQ) return localized **strings** for `name`/`description`/etc. based on `?lang` (falls back to `en`).
- **Write/admin** endpoints return the raw `{ en, ka, ru }` objects (the saved document).
- **Cart** returns product `name` as the raw `{ en, ka, ru }` object (client picks the language).

### 1.5 Pricing & cart business rules (read this before integrating the cart)

**Food products** (sold by the kilogram, two-tier volume price — no percentage sale):
- `quantity < kgThreshold` → unit price = `pricePerKg`
- `quantity >= kgThreshold` → unit price = `bulkPricePerKg` (lower)
- `quantity` may be **fractional** (kg); must be `>= minKg`.

**Animal products** (packaged, percentage discount):
- `discountedPrice = price * (1 - sale / 100)` (`sale` is 0–100).
- `quantity` is the number of **packages** — must be a **whole number**.

**Cart pricing is always live.** Every cart response recomputes each line's price from the current product (there is no frozen snapshot). Each line returns both `unitPrice` (effective/discounted) and `originalUnitPrice` (pre-discount), plus `totalPrice`. Cart totals include `cartSavings = cartOriginalTotal - cartTotal`. Adding to cart does **not** decrement stock.

---

## 2. `/auth`

### `POST /auth/login`
Public. Log in with email + password.

**Body**
| Field | Type | Required | Notes |
|---|---|---|---|
| `email` | string | ✅ | |
| `password` | string | ✅ | |

**Example**
```json
{ "email": "user@example.com", "password": "Passw0rd!" }
```

**Success `200`**
```json
{ "success": true, "data": { "accessToken": "eyJ...", "refreshToken": "eyJ..." }, "message": "Login successful" }
```

**Errors:** `401 INVALID_CREDENTIALS` (wrong email/password), `401 EMAIL_NOT_VERIFIED`, `400 VALIDATION_ERROR` (missing fields).

---

### `POST /auth/token`
Public. Exchange a valid refresh token for a new access token. *(Changed from GET — token goes in the body.)*

**Body**
| Field | Type | Required |
|---|---|---|
| `token` | string (refresh token) | ✅ |

**Success `200`**
```json
{ "success": true, "data": { "accessToken": "eyJ..." }, "message": "Access token refreshed" }
```

**Errors:** `401 TOKEN_MISSING`, `403 TOKEN_INVALID` (unknown or unverifiable refresh token).

---

### `POST /auth/logout`
Public. Invalidate a refresh token server-side.

**Body:** `{ "token": "<refreshToken>" }`

**Success `200`:** `{ "success": true, "data": null, "message": "Logout successful" }`

**Errors:** `401 TOKEN_MISSING`, `403 TOKEN_INVALID`.

---

### `PUT /auth/changePassword`
Authenticated. Header: `Authorization: Bearer <accessToken>`.

**Body**
| Field | Type | Required | Rules |
|---|---|---|---|
| `oldPassword` | string | ✅ | |
| `newPassword` | string | ✅ | 8–24 chars, first uppercase, ≥1 digit, ≥1 of `!@#$%^&*` |
| `newPasswordRepeat` | string | ✅ | must equal `newPassword` |

**Success `200`:** `{ "success": true, "data": null, "message": "Password updated successfully" }`

**Errors:** `400 VALIDATION_ERROR`, `400 SAME_PASSWORD`, `400 PASSWORDS_DO_NOT_MATCH`, `400 INVALID_PASSWORD`, `400 INCORRECT_OLD_PASSWORD`, `404 NOT_FOUND`, `401 TOKEN_MISSING/TOKEN_INVALID`.

---

## 3. `/email`

### `POST /email/registration`
Public. Register a new user; a verification email is sent.

**Body**
| Field | Type | Required | Rules |
|---|---|---|---|
| `name` | string | ✅ | |
| `lastName` | string | ✅ | |
| `email` | string | ✅ | valid email; unique |
| `number` | string | ✅ | unique |
| `password` | string | ✅ | 8–24, first uppercase, ≥1 digit, ≥1 special |

**Success `201`:** `{ "success": true, "data": null, "message": "Registered successfully. Check your email for verification." }`

**Errors:** `400 VALIDATION_ERROR`, `400 INVALID_PASSWORD`, `409 EMAIL_EXISTS`, `409 NUMBER_EXISTS`.

*Note:* `isAdmin` cannot be set via registration — admins are provisioned manually.

---

### `GET /email/verify/:token`
Public. Confirm an email using the token from the verification link. Token valid for **24h**.

**Success `200`:** `{ "success": true, "data": null, "message": "Email verified successfully" }`

**Errors:** `400 TOKEN_INVALID` (invalid or expired).

---

### `POST /email/forgot-password`
Public. Request a reset link (valid **1h**). Always returns `200` — it does **not** reveal whether the email exists.

**Body:** `{ "email": "user@example.com" }`

**Success `200`:** `{ "success": true, "data": null, "message": "If an account with that email exists, password reset instructions have been sent." }`

**Errors:** `400 VALIDATION_ERROR` (missing email).

---

### `POST /email/reset-password/:token`
Public. Set a new password using the reset token.

**Body**
| Field | Type | Required | Rules |
|---|---|---|---|
| `newPassword` | string | ✅ | 8–24, first uppercase, ≥1 digit, ≥1 special |

**Success `200`:** `{ "success": true, "data": null, "message": "Password reset successful" }`

**Errors:** `400 INVALID_PASSWORD`, `400 TOKEN_INVALID` (invalid or expired).

---

## 4. `/products/food` (public)

Query param for all: `?lang=en|ka|ru` (default `en`).

**Localized food product object**
```json
{
  "_id": "665...",
  "name": "Chicken Kibble",
  "productType": "food",
  "category": { "_id": "663...", "name": "Dry Food", "icon": "...", "slug": "dry-food", "products": ["..."] },
  "description": "High-protein dry food",
  "images": ["uploads/uuid-a.jpg"],
  "isNewProduct": false,
  "minKg": 0.5,
  "kgThreshold": 10,
  "pricePerKg": 12.5,
  "bulkPricePerKg": 10,
  "quantity": 250
}
```

### `GET /products/food/categories`
List food categories (id, localized name, icon, slug).

**Success `200`:** `{ "success": true, "data": [ { "_id": "...", "name": "Dry Food", "icon": "...", "slug": "dry-food" } ], "message": "OK" }` (empty → `data: []`).

### `GET /products/food/category/:categoryId`
Products within a category (localized `name`/`description`).

**Success `200`:** `data: [ ...localized products ]`. **Errors:** `404 CATEGORY_NOT_FOUND`.

### `GET /products/food/:id`
Single product. **Success `200`:** `data: {localized product}`. **Errors:** `404 PRODUCT_NOT_FOUND`, `400 VALIDATION_ERROR` (malformed id).

### `GET /products/food/`
All food products. **Success `200`:** `data: [ ...localized products ]`.

---

## 5. `/products/animal` (public)

Identical route shape to food. Query param `?lang`.

**Localized animal product object** (note `discountedPrice` is included):
```json
{
  "_id": "667...",
  "name": "Salmon Treats",
  "productType": "animal",
  "category": { "_id": "664...", "name": "Treats", "icon": "...", "slug": "treats", "products": ["..."] },
  "description": "Grain-free treats",
  "images": ["uploads/uuid-b.jpg"],
  "isNewProduct": true,
  "sale": 20,
  "price": 15,
  "discountedPrice": 12,
  "quantity": 40,
  "packageWeight": "400g"
}
```

- `GET /products/animal/categories`
- `GET /products/animal/category/:categoryId` — `404 CATEGORY_NOT_FOUND`
- `GET /products/animal/:id` — `404 PRODUCT_NOT_FOUND`
- `GET /products/animal/`

Responses mirror the food endpoints.

---

## 6. `/admin/food` (admin only)

All routes require: `Authorization: Bearer <accessToken>` **and** `isAdmin: true`. Common errors on every route: `401 TOKEN_MISSING/TOKEN_INVALID`, `403 FORBIDDEN`.

### `POST /admin/food/categories`
JSON body.

| Field | Type | Required |
|---|---|---|
| `name` | `{ en, ka, ru }` (object; `en` required) | ✅ |
| `icon` | string | ✅ |
| `slug` | string | ✅ |
| `description` | string | optional |

**Example**
```json
{ "name": { "en": "Dry Food", "ka": "მშრალი", "ru": "Сухой" }, "icon": "dry.svg", "slug": "dry-food" }
```
**Success `201`:** `{ "success": true, "data": { "category": { ... } }, "message": "Category created successfully" }`
**Errors:** `400 VALIDATION_ERROR`.

### `DELETE /admin/food/categories/:categoryId`
> ⚠️ **DESTRUCTIVE & IRREVERSIBLE — CASCADING DELETE.** This deletes the category **and every FoodProduct in it** (and those products' S3 images). The UI **must** show a confirmation warning before calling this, e.g. *"This will delete the category and all products in it — are you sure?"*

Products and the category are removed together atomically (DB transaction where supported; otherwise products are deleted first, then the category, so the DB is never left inconsistent). S3 image cleanup runs after the DB delete is committed (best-effort).

**Success `200`**
```json
{ "success": true, "data": { "deletedProductsCount": 50 }, "message": "Category and 50 product(s) deleted successfully" }
```
`deletedProductsCount` is the exact number of products removed alongside the category (may be `0`).

**Errors:** `404 CATEGORY_NOT_FOUND`.

### `POST /admin/food/products`
**`multipart/form-data`.** Up to 4 image files under field name **`files`**. Localized fields are sent as **JSON strings**.

| Field | Type | Required | Notes |
|---|---|---|---|
| `files` | file[] | ✅ (≥1) | image/jpeg,png,webp,gif; ≤5MB each |
| `name` | JSON string | ✅ | `'{"en":"..","ka":"..","ru":".."}'` |
| `description` | JSON string | ✅ | same shape |
| `categoryId` | string | ✅ | must exist |
| `minKg` | number | ✅ | ≥0 |
| `kgThreshold` | number | ✅ | ≥0 |
| `pricePerKg` | number | ✅ | ≥0 |
| `bulkPricePerKg` | number | ✅ | ≥0 |
| `quantity` | number | ✅ | ≥0 (kg, may be fractional) |
| `isNewProduct` | boolean-ish | optional | only `true`/`"true"` → true |

**Success `201`:** `{ "success": true, "data": { "product": { ...saved doc with name/description as objects } }, "message": "Product created successfully" }`
**Errors:** `400 CATEGORY_NOT_FOUND`, `400 VALIDATION_ERROR` (no image, bad JSON, bad number, bad file type).

### `PUT /admin/food/products/:productId`
**`multipart/form-data`.** All fields optional; only provided fields are updated. Sending new `files` **replaces** all images (old ones are deleted from S3). Changing `categoryId` moves the product between categories.

**Success `200`:** `data: { product }`, `"Product updated successfully"`. **Errors:** `404 PRODUCT_NOT_FOUND`, `400 CATEGORY_NOT_FOUND`, `400 VALIDATION_ERROR`.

### `DELETE /admin/food/products/:productId`
Deletes the product, its S3 images, and removes it from its category.
**Success `200`:** `data: null`, `"Product deleted successfully"`. **Errors:** `404 PRODUCT_NOT_FOUND`.

---

## 7. `/admin/animal` (admin only)

Same structure as `/admin/food`. Product body differs:

### `POST /admin/animal/products` — `multipart/form-data`
| Field | Type | Required | Notes |
|---|---|---|---|
| `files` | file[] | ✅ (≥1) | as above |
| `name` | JSON string | ✅ | `{en,ka,ru}` |
| `description` | JSON string | ✅ | `{en,ka,ru}` |
| `categoryId` | string | ✅ | must exist |
| `price` | number | ✅ | ≥0 |
| `sale` | number | optional | 0–100 (default 0) |
| `quantity` | number | ✅ | ≥0, **integer** (packages) |
| `packageWeight` | string | ✅ | e.g. `"400g"` |
| `isNewProduct` | boolean-ish | optional | `true`/`"true"` → true |

**Success `201`:** `data: { product }`.
**Errors:** `400 CATEGORY_NOT_FOUND`, `400 VALIDATION_ERROR`.

### `PUT /admin/animal/products/:productId` — `multipart/form-data`
All fields optional; same image-replacement and category-move behavior as food.

### `DELETE /admin/animal/products/:productId`
Same as food.

### Categories
- `POST /admin/animal/categories` — body `{ name:{en,ka,ru}, icon, slug, description? }`
- `DELETE /admin/animal/categories/:categoryId` — ⚠️ **DESTRUCTIVE cascading delete**, identical behavior to the food version above: removes the category **and every AnimalProduct in it** (plus their S3 images), atomically. Responds `data: { "deletedProductsCount": N }`, message `"Category and N product(s) deleted successfully"`. The UI must show a confirmation warning. **Errors:** `404 CATEGORY_NOT_FOUND`.

---

## 8. `/admin/faq` (admin only)

### `POST /admin/faq/types`
JSON. Create an FAQ type (topic) optionally with questions.

| Field | Type | Required |
|---|---|---|
| `name` | `{ en, ka, ru }` | ✅ |
| `icon` | string | ✅ |
| `questions` | array of `{ question:{en,ka,ru}, answer:{en,ka,ru} }` | optional |

**Success `201`:** `data: { faqType }`, `"FAQ type added successfully"`. **Errors:** `400 VALIDATION_ERROR`.

### `DELETE /admin/faq/types/:faqTypeId`
`data: null`, `"FAQ type deleted successfully"`. **Errors:** `404 NOT_FOUND`.

### `POST /admin/faq/questions`
JSON. Add a question to an existing type.

| Field | Type | Required |
|---|---|---|
| `faqTypeId` | string | ✅ |
| `question` | `{ en, ka, ru }` | ✅ |
| `answer` | `{ en, ka, ru }` | ✅ |

**Success `201`:** `data: { faqType }`, `"Question added successfully"`. **Errors:** `400 VALIDATION_ERROR`, `404 NOT_FOUND`.

### `DELETE /admin/faq/questions/:faqTypeId/:faqQuestionId`
`data: null`, `"Question deleted successfully"`. **Errors:** `404 NOT_FOUND` (type or question).

---

## 9. `/admin/question` (admin only)

### `GET /admin/question/`
List submitted contact questions, newest first.
**Success `200`:** `{ "success": true, "data": { "count": 3, "questions": [ { "_id","userName","email","title","question","createdAt","updatedAt" } ] }, "message": "Questions fetched" }`

### `DELETE /admin/question/deleteAll`
Deletes **all** questions.
**Success `200`:** `data: { "deletedCount": 3 }`, `"All questions deleted"`.

---

## 10. `/admin/subscription` (admin only)

### `GET /admin/subscription/email/subscribers`
`data: { "count": N, "subscribers": [ { "_id","email","subscriptionDate" } ] }`

### `GET /admin/subscription/phone/subscribers`
`data: { "count": N, "subscribers": [ { "_id","phoneNumber","subscriptionDate" } ] }`

---

## 11. `/cart` (authenticated — all routes)

Header on every route: `Authorization: Bearer <accessToken>`.

**Cart response** (returned by every cart endpoint):
```json
{
  "success": true,
  "data": {
    "cart": [
      {
        "_id": "line123",
        "product": { "_id": "665...", "name": { "en": "Chicken Kibble", "ka": "...", "ru": "..." }, "images": ["uploads/..."] },
        "productType": "food",
        "quantity": 12,
        "unitPrice": 10,
        "originalUnitPrice": 12.5,
        "totalPrice": 120,
        "image": "uploads/uuid-a.jpg",
        "available": true
      }
    ],
    "cartTotal": 120,
    "cartOriginalTotal": 150,
    "cartSavings": 30
  },
  "message": "Cart fetched successfully"
}
```
Notes: `unitPrice` = live effective price; `originalUnitPrice` = pre-discount (food: `pricePerKg`; animal: `price`). `available: false` and `product: null` mean the referenced product was deleted (line kept with last-known price).

### `GET /cart/`
Fetch the cart. **Success `200`** (see shape above). **Errors:** `404 NOT_FOUND` (user).

### `POST /cart/add`
Add `quantity` to a line (`+=`). Used on the product page and the cart "+" button.

| Field | Type | Required | Notes |
|---|---|---|---|
| `productId` | string | ✅ | |
| `productType` | `"food"` \| `"animal"` | ✅ | |
| `quantity` | number | optional | default `1`; food fractional ok, animal integer |

**Example:** `{ "productId": "665...", "productType": "food", "quantity": 5 }`
**Success `200`:** cart response, `"Product added to cart"`.
**Errors:** `400 VALIDATION_ERROR`, `404 PRODUCT_NOT_FOUND`, `400 BELOW_MIN_KG`, `400 INSUFFICIENT_STOCK`.

### `PUT /cart/set-quantity`
Set an **absolute** line quantity (`=`). Used by the cart-page quantity input. The line must already exist.

| Field | Type | Required |
|---|---|---|
| `productId` | string | ✅ |
| `productType` | `"food"` \| `"animal"` | ✅ |
| `quantity` | number | ✅ |

**Success `200`:** cart response, `"Cart quantity updated"`.
**Errors:** `404 CART_ITEM_NOT_FOUND`, `404 PRODUCT_NOT_FOUND`, `400 BELOW_MIN_KG`, `400 INSUFFICIENT_STOCK`, `400 VALIDATION_ERROR`.
*To remove a line, use `DELETE /cart/remove-item` (set-quantity rejects values below the minimum).*

### `DELETE /cart/remove`
Decrement the line quantity by **1**. Removes the line when it reaches 0. Used by the cart "−" button.

| Field | Type | Required |
|---|---|---|
| `productId` | string | ✅ |
| `productType` | `"food"` \| `"animal"` | ✅ |

**Success `200`:** cart response, message `"Quantity decreased"` or `"Item removed from cart"`.
**Errors:** `404 CART_ITEM_NOT_FOUND`, `400 VALIDATION_ERROR`.

### `DELETE /cart/remove-item`
Delete an entire line in one call (cart "🗑️" button), regardless of quantity.

**Body:** `{ "productId": "...", "productType": "food" }`
**Success `200`:** cart response, `"Item removed from cart"`. **Errors:** `404 CART_ITEM_NOT_FOUND`.

### `DELETE /cart/clear`
Empty the whole cart.
**Success `200`:** cart response (empty cart, totals `0`), `"Cart cleared"`.

---

## 12. `/user` (authenticated)

### `GET /user/`
Current user's profile.
**Success `200`:** `{ "success": true, "data": { "user": { "_id","name","lastName","email","number","address" } }, "message": "User fetched successfully" }`
**Errors:** `404 NOT_FOUND`.

### `PUT /user/updateUserInfo`
Update profile fields. Only changed fields are applied; at least one change required.

| Field | Type | Required |
|---|---|---|
| `name` | string | optional |
| `lastName` | string | optional |
| `number` | string | optional (unique) |
| `address` | string | optional |

**Success `200`:** `data: { user: { name,lastName,email,number,address } }`, `"User updated successfully"`.
**Errors:** `400 VALIDATION_ERROR` ("No changes detected"), `409 CONFLICT` (duplicate number), `404 NOT_FOUND`.

---

## 13. `/faq` (public)

### `GET /faq/`
Active FAQ types with localized questions/answers. Query `?lang`.
**Success `200`:**
```json
{
  "success": true,
  "data": [
    { "_id": "...", "name": "Shipping", "icon": "...", "isActive": true,
      "questions": [ { "_id": "...", "question": "How long?", "answer": "2-3 days", "isActive": true } ] }
  ],
  "message": "FAQ types fetched successfully"
}
```
Empty → `data: []`.

---

## 14. `/question` (public)

### `POST /question/add`
Submit a contact question.

| Field | Type | Required |
|---|---|---|
| `userName` | string | ✅ |
| `email` | string | ✅ (valid email) |
| `question` | string | ✅ |
| `title` | string | optional |

**Success `201`:** `data: null`, `"Question submitted successfully"`.
**Errors:** `400 VALIDATION_ERROR`.

---

## 15. `/subscription` (public)

### `POST /subscription/email/subscribe`
**Body:** `{ "email": "user@example.com" }`
**Success `201`:** `data: { subscription: { _id, email, subscriptionDate } }`, `"Email subscribed successfully"`.
**Errors:** `400 VALIDATION_ERROR`, `409 DUPLICATE_SUBSCRIPTION`.

### `POST /subscription/phone/subscribe`
**Body:** `{ "phoneNumber": "555123456" }` — format `5xxxxxxxx` (9 digits, starts with 5).
**Success `201`:** `data: { subscription: { _id, phoneNumber, subscriptionDate } }`, `"Phone subscribed successfully"`.
**Errors:** `400 VALIDATION_ERROR`, `409 DUPLICATE_SUBSCRIPTION`.

---

## 16. Quick route index

| Method | Path | Access |
|---|---|---|
| POST | `/auth/login` | public |
| POST | `/auth/token` | public |
| POST | `/auth/logout` | public |
| PUT | `/auth/changePassword` | authenticated |
| POST | `/email/registration` | public |
| GET | `/email/verify/:token` | public |
| POST | `/email/forgot-password` | public |
| POST | `/email/reset-password/:token` | public |
| GET | `/products/food/categories` | public |
| GET | `/products/food/category/:categoryId` | public |
| GET | `/products/food/:id` | public |
| GET | `/products/food/` | public |
| GET | `/products/animal/*` | public (mirror of food) |
| POST | `/admin/food/categories` | admin |
| DELETE | `/admin/food/categories/:categoryId` | admin |
| POST | `/admin/food/products` | admin |
| PUT | `/admin/food/products/:productId` | admin |
| DELETE | `/admin/food/products/:productId` | admin |
| — | `/admin/animal/*` | admin (mirror of food) |
| POST | `/admin/faq/types` | admin |
| DELETE | `/admin/faq/types/:faqTypeId` | admin |
| POST | `/admin/faq/questions` | admin |
| DELETE | `/admin/faq/questions/:faqTypeId/:faqQuestionId` | admin |
| GET | `/admin/question/` | admin |
| DELETE | `/admin/question/deleteAll` | admin |
| GET | `/admin/subscription/email/subscribers` | admin |
| GET | `/admin/subscription/phone/subscribers` | admin |
| GET | `/cart/` | authenticated |
| POST | `/cart/add` | authenticated |
| PUT | `/cart/set-quantity` | authenticated |
| DELETE | `/cart/remove` | authenticated |
| DELETE | `/cart/remove-item` | authenticated |
| DELETE | `/cart/clear` | authenticated |
| GET | `/user/` | authenticated |
| PUT | `/user/updateUserInfo` | authenticated |
| GET | `/faq/` | public |
| POST | `/question/add` | public |
| POST | `/subscription/email/subscribe` | public |
| POST | `/subscription/phone/subscribe` | public |
