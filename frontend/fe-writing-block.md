# Frontend Decisions & Implementation Guide

## 1. Project Overview

Frontend application for the Fullstack Developer Technical Test.

The frontend will communicate with a separately running Hono backend through REST APIs.

The implementation should prioritize:
- Simple and maintainable architecture.
- Clean, readable, and natural code.
- Consistent UI and user experience.
- Type safety using TypeScript.
- Minimal dependencies.
- Functional completeness based on the technical test requirements.

## 2. Technology Stack

| Area | Technology |
|---|---|
| Framework | Nuxt 3 |
| UI Framework | Vue 3 |
| Language | TypeScript |
| State Management | Pinia |
| CSS Framework | Tailwind CSS |
| API Communication | Nuxt `$fetch` |
| Form Validation | Zod |
| Routing | Nuxt File-based Routing |
| Testing | Vitest |
| Package Manager | pnpm |

Use compatible and stable package versions. Avoid unnecessary dependencies.

## 3. Application Rendering

Use Nuxt in SPA mode by setting:

```ts
export default defineNuxtConfig({
  ssr: false,
});
```

### Reasoning

- The application is an internal dashboard, not a public-facing website.
- SEO is not required.
- Most pages require authentication.
- Client-side rendering is sufficient for the application's needs.
- Keeps the rendering architecture simple.

Do not introduce SSR-specific authentication complexity unless required by an actual implementation constraint.

## 4. State Management

Use Pinia for shared application state.

Keep global state minimal. Not every API response or page-level value needs to be stored in Pinia.

### Auth Store

Create:

```text
stores/
└── auth.ts
```

Responsibilities:
- Store the access token.
- Store the authenticated user information.
- Track authentication state.
- Handle login and logout.
- Restore authentication state when the application is initialized.

### Local Component State

Use Vue `ref()` and `computed()` for:
- Product table data.
- Search keyword and pagination.
- Customer form state.
- Order form state.
- Selected products and quantities.
- Calculated order totals.
- Loading and dialog states.

Do not create separate Pinia stores for products, customers, and orders unless shared state across multiple pages genuinely requires them.

Fetch page-specific data through composables or directly through the relevant page logic.

## 5. API Communication

Use Nuxt `$fetch` for HTTP requests.

Create a centralized API utility:

```text
utils/
└── api.ts
```

Responsibilities:
- Define the backend API base URL.
- Attach the JWT Bearer Token automatically.
- Standardize API request handling.
- Handle HTTP errors consistently.
- Avoid repeating API configuration across pages and components.

The backend URL must be configurable through environment variables.

Example:

```env
NUXT_PUBLIC_API_BASE=http://localhost:3000/api
```

Use the configured base URL rather than hardcoding backend URLs in individual components.

### Authentication Header

For authenticated requests:

```http
Authorization: Bearer <access_token>
```

Login is the only endpoint that does not require authentication.

### Error Handling

Display meaningful API error messages to users.

For validation errors:
- Display field-specific errors when available.
- Show insufficient stock errors on the corresponding order item.
- Show general errors through a notification or alert.
- Do not expose technical stack traces or internal server details.

Do not silently ignore failed API requests.

## 6. Authentication

Use JWT Bearer Token authentication.

### Token Storage

For this technical test, store the access token in `localStorage`.

The authentication store should:
- Save the token after successful login.
- Restore the token when the application initializes.
- Attach the token to authenticated API requests.
- Clear authentication data when logging out.
- Handle expired or invalid tokens by clearing authentication state and redirecting to login.

The authenticated user information can be retrieved through the backend's `GET /api/auth/me` endpoint.

Do not store passwords or other sensitive authentication data in localStorage.

Note: localStorage-based authentication is a simplicity trade-off for this test. It is exposed to token theft if an XSS vulnerability exists, so avoid unsafe HTML rendering and keep dependencies controlled.

### Route Protection

Create Nuxt route middleware:

```text
middleware/
├── auth.ts
└── guest.ts
```

Responsibilities:

- `auth.ts`: Protect pages that require authentication.
- `guest.ts`: Prevent authenticated users from accessing the login page.

Unauthenticated users should be redirected to `/login`.

Authenticated users visiting `/login` should be redirected to the dashboard.

Because the application uses SPA mode, authentication checks should account for client-side initialization and token restoration.

## 7. Styling and UI Components

Use Tailwind CSS for all styling.

Do not install additional UI component frameworks such as:
- Vuetify
- PrimeVue
- Element Plus

Build only the reusable components needed by the application.

### UI Guidelines

The application should have a clean, modern, and professional dashboard appearance.

Prioritize:
- Consistent spacing.
- Clear typography hierarchy.
- Readable tables.
- Simple forms.
- Consistent buttons and input fields.
- Clear loading and empty states.
- Responsive layouts.
- Appropriate confirmation dialogs for important actions.

### Reusable Components

Create reusable components only when they are used in multiple places.

Examples:

```text
components/
├── AppSidebar.vue
├── AppHeader.vue
├── BaseButton.vue
├── BaseInput.vue
├── BaseSelect.vue
├── BaseModal.vue
├── BaseTable.vue
└── BasePagination.vue
```

Avoid creating abstractions for components that are only used once without a clear benefit.

## 8. Frontend Validation

Use Zod for client-side form validation.

Validate:
- Login fields.
- Product creation and editing.
- Customer creation.
- Order creation.
- Required fields and numeric constraints.

For order creation:
- Require a customer.
- Require at least one product.
- Require positive integer quantities.
- Prevent duplicate product selection.
- Display product stock information.
- Calculate subtotal, discount, and grand total for preview.

Important:
- Frontend calculations are only for user convenience.
- The backend remains the authoritative source for prices, stock, discounts, and order totals.
- Never trust client-submitted monetary calculations.
- Always display the final values returned by the backend after a successful order creation.

## 9. Pages and Features

Implement the following pages based on the technical test requirements.

### 9.1 Login

Route:

```text
/login
```

Features:
- Email input.
- Password input.
- Form validation.
- Login API integration.
- Display invalid credentials errors.
- Redirect to dashboard after successful login.

### 9.2 Dashboard

Route:

```text
/
```

Provide a simple landing page after login.

It may contain a small summary of products, customers, and orders if the backend data makes this straightforward.

Do not spend excessive time building complex analytics or charts that are not required by the test.

### 9.3 Products

Route:

```text
/products
```

Features:
- Display product table.
- Search by product name or product code.
- Pagination.
- Create product.
- Edit product.
- Display price and stock.
- Validate product fields.

### 9.4 Customers

Route:

```text
/customers
```

Features:
- Display customer list.
- Create customer.
- Display customer information.
- Basic form validation.

### 9.5 Orders

Route:

```text
/orders
```

Features:
- Display order list.
- Filter by order status.
- Filter by date range.
- Pagination.
- Display invoice number, customer, date, total, and status.
- Navigate to order detail.

### 9.6 Create Order

Route:

```text
/orders/create
```

Features:
- Select customer.
- Add one or more products.
- Select product quantities.
- Display available stock.
- Calculate item subtotals.
- Calculate order subtotal.
- Calculate discount based on Variant A rules.
- Display grand total.
- Submit order to backend.
- Display validation and insufficient stock errors on the relevant product item.

Discount rules:

| Subtotal | Discount |
|---|---:|
| Below Rp500,000 | 0% |
| Rp500,000 – below Rp1,000,000 | 5% |
| Rp1,000,000 or more | 10% |

Maximum discount: Rp150,000.

The frontend may preview this calculation, but the backend must calculate and persist the authoritative result.

### 9.7 Order Detail

Route:

```text
/orders/[id]
```

Features:
- Display invoice number.
- Display customer information.
- Display order items.
- Display unit price snapshots.
- Display subtotal, discount, and grand total.
- Display current order status.
- Pay order action.
- Cancel order action.
- Confirmation dialog before payment or cancellation.

Only show actions that are valid for the current order status.

The backend remains responsible for validating status transitions.

## 10. Money and Number Formatting

The backend uses PostgreSQL BIGINT for monetary values and serializes monetary fields as strings in JSON.

Frontend requirements:
- Treat monetary API values as integer strings.
- Avoid unnecessary conversion to JavaScript `Number` for monetary calculations.
- Use `BigInt` for integer monetary calculations where necessary.
- Convert monetary values to formatted Rupiah strings for display.
- Use `Intl.NumberFormat('id-ID')` for currency formatting.

Example:

```ts
const formatRupiah = (value: string | bigint) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
};
```

Ensure the formatter handles the API's string representation safely.

## 11. Suggested Project Structure

```text
frontend/
├── assets/
│   └── css/
│       └── main.css
├── components/
│   ├── AppSidebar.vue
│   ├── AppHeader.vue
│   ├── BaseButton.vue
│   ├── BaseInput.vue
│   ├── BaseSelect.vue
│   ├── BaseModal.vue
│   ├── BaseTable.vue
│   └── BasePagination.vue
├── composables/
│   ├── useProducts.ts
│   ├── useCustomers.ts
│   └── useOrders.ts
├── layouts/
│   └── default.vue
├── middleware/
│   ├── auth.ts
│   └── guest.ts
├── pages/
│   ├── login.vue
│   ├── index.vue
│   ├── products/
│   │   └── index.vue
│   ├── customers/
│   │   └── index.vue
│   └── orders/
│       ├── index.vue
│       ├── create.vue
│       └── [id].vue
├── stores/
│   └── auth.ts
├── types/
│   ├── api.ts
│   ├── auth.ts
│   ├── product.ts
│   ├── customer.ts
│   └── order.ts
├── utils/
│   ├── api.ts
│   └── currency.ts
├── app.vue
├── nuxt.config.ts
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

This structure is a starting point. Adjust it when necessary, but avoid unnecessary folder nesting and abstractions.

## 12. Testing

Use Vitest for frontend testing.

Prioritize testing important logic:
- Form validation.
- Discount calculation preview.
- Currency formatting.
- Authentication state behavior.
- Important reusable composables where practical.

Backend integration tests remain responsible for verifying actual business rules, database transactions, stock consistency, and order status transitions.

## 13. Implementation Guidelines for AI

When implementing the frontend:

1. Follow the requirements in the original technical test document.
2. Follow this document for frontend architecture and technology decisions.
3. Follow `BACKEND_DECISIONS.md` for backend API contracts and data formats.
4. Keep frontend and backend as separate services.
5. Use TypeScript consistently.
6. Reuse components and composables when they provide genuine value.
7. Avoid unnecessary dependencies and over-engineering.
8. Keep API communication centralized.
9. Keep business-critical calculations and validation on the backend.
10. Ensure all required user flows work end-to-end.

### Code Style and Readability

Write code naturally, keep it easy to read, and make every abstraction earn its place.

Prefer:
- Clear and descriptive naming.
- Small functions with focused responsibilities.
- Straightforward control flow.
- Consistent formatting.
- Simple Vue components.
- Explicit types where they improve clarity.

Avoid:
- Overly abstract architectures.
- Unnecessary design patterns.
- Excessive one-line expressions.
- Deeply nested components.
- Duplicated API configuration.
- Unnecessary global state.
- Premature optimization.

The goal is not to demonstrate the most complex architecture. The goal is to deliver a working, maintainable application with clear and understandable code.