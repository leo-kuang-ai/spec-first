# Code Quality & Performance

> Comprehensive frontend quality guidelines for Cloudflare Workers + React Router v7 applications.

---

## Performance

### Bundle Size Awareness

Cloudflare Workers have execution-time limits and static asset size considerations. Keep the frontend bundle lean.

**Guidelines:**

- Check bundle size impact before adding new dependencies: `npx bundlephobia <package-name>`
- Prefer lightweight alternatives (e.g., `date-fns` over `moment`, `clsx` over `classnames`)
- Avoid importing entire libraries when only a subset is needed

```typescript
// Good - tree-shakeable import
import { format, parseISO } from "date-fns";

// Bad - imports the entire library
import moment from "moment";
```

- Use the Vite bundle analyzer periodically:

```bash
npx vite-bundle-visualizer
```

### Lazy Loading Routes

Split route components to reduce initial load time. React Router v7 supports lazy routes natively:

```typescript
// app/routes.ts
import { type RouteConfig, route, lazy } from "@react-router/dev/routes";

const routes: RouteConfig = [
  // Eagerly loaded (critical path)
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),

  // Lazy loaded (non-critical)
  route("dashboard", "routes/dashboard.tsx"),
  route("settings", "routes/settings.tsx"),
];
```

For component-level splitting within a route:

```tsx
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const HeavyChart = lazy(() => import("@/modules/dashboard/components/heavy-chart"));

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <HeavyChart />
      </Suspense>
    </div>
  );
}
```

### Image Optimization

Cloudflare Workers serve static assets from the edge. Optimize images for fast delivery:

- Use modern formats: WebP or AVIF where supported
- Set explicit `width` and `height` on `<img>` elements to prevent layout shift
- Use responsive images with `srcset` for different viewport sizes
- Lazy-load below-the-fold images

```tsx
// Good - explicit dimensions and lazy loading
<img
  src="/images/hero.webp"
  alt="Hero banner"
  width={1200}
  height={600}
  loading="lazy"
  decoding="async"
/>
```

### Cloudflare Static Assets

- Place static files in `public/` for direct edge serving
- Use cache-friendly filenames (Vite adds content hashes automatically for imported assets)
- Leverage Cloudflare's built-in caching headers for `public/` assets
- For dynamic assets (user uploads), use Cloudflare R2 with signed URLs

---

## Before-Commit Checklist

Run these checks before every commit:

```bash
# TypeScript strict mode - no errors
pnpm type-check

# Lint - 0 errors, 0 warnings
pnpm lint

# Format check (if using Prettier)
pnpm format:check

# Tests pass
pnpm test
```

### TypeScript Strict Rules

| Rule | Requirement |
|------|-------------|
| `strict: true` | Must be enabled in `tsconfig.json` |
| No `any` type | Use `unknown` and narrow, or define proper types |
| No non-null assertions (`!`) | Use optional chaining, nullish coalescing, or explicit checks |
| No `@ts-ignore` | Use `@ts-expect-error` with a comment explaining why, if absolutely necessary |
| No implicit `any` in parameters | All function parameters must be typed |
| Strict null checks | Handle `null` and `undefined` explicitly |

```typescript
// Bad
function processItem(item: any) {
  return item.name!.toUpperCase();
}

// Good
function processItem(item: { name: string | null }) {
  return item.name?.toUpperCase() ?? "Unknown";
}
```

---

## Forbidden Patterns

### 1. Direct DOM Manipulation

```tsx
// FORBIDDEN
document.getElementById("myElement")!.style.display = "none";

// CORRECT - Use React state
const [isVisible, setIsVisible] = useState(true);
return isVisible ? <div>Content</div> : null;
```

### 2. Inline Fetch in Components

```tsx
// FORBIDDEN - fetch inside component body
export default function ItemsPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch("/api/items")
      .then((res) => res.json())
      .then((data) => setItems(data));
  }, []);
}

// CORRECT - Use a custom hook with React Query
import { useItems } from "@/modules/items/hooks/use-items";

export default function ItemsPage() {
  const { data: items, isLoading } = useItems();
}
```

### 3. Index Files as Re-export Barrels

```typescript
// FORBIDDEN - barrel exports cause larger bundles and circular dependency risks
// modules/items/index.ts
export * from "./components/item-card";
export * from "./components/item-list";
export * from "./hooks/use-items";

// CORRECT - Import directly from the specific file
import { ItemCard } from "@/modules/items/components/item-card";
```

### 4. Hardcoded API URLs

```typescript
// FORBIDDEN
fetch("https://api.myapp.com/items");

// CORRECT - Use environment variables
fetch(`${import.meta.env.VITE_API_URL}/items`);

// CORRECT - Use relative URL (same origin)
fetch("/api/items");
```

### 5. Console Statements in Production Code

```typescript
// FORBIDDEN - remove before commit
console.log("debug:", data);

// ACCEPTABLE - error logging only
console.error("Failed to fetch items:", error);
```

### 6. Non-null Assertions on User Input or API Responses

```typescript
// FORBIDDEN
const userId = params.userId!;
const name = apiResponse.user!.name!;

// CORRECT
const userId = params.userId;
if (!userId) throw new Response("Not Found", { status: 404 });

const name = apiResponse.user?.name ?? "Unknown";
```

### 7. Synchronous Storage Access in Render

```tsx
// FORBIDDEN - blocks rendering
function Component() {
  const theme = localStorage.getItem("theme"); // synchronous I/O in render

  // CORRECT - Use a hook
  const theme = useLocalStorage("theme", "light");
}
```

---

## Accessibility Requirements

### Semantic HTML

Use the correct HTML element for the job:

| Task | Correct Element | Wrong Element |
|------|----------------|---------------|
| Clickable action | `<button>` | `<div onClick>` |
| Navigation link | `<a href>` or `<Link to>` | `<span onClick>` |
| Page heading | `<h1>` - `<h6>` (in order) | `<div className="title">` |
| List of items | `<ul>` / `<ol>` + `<li>` | Nested `<div>` |
| Form field | `<input>` with `<label>` | `<div contentEditable>` |
| Navigation | `<nav>` | `<div className="nav">` |
| Main content | `<main>` | `<div className="main">` |

### ARIA Attributes

When semantic HTML is not sufficient:

```tsx
// Loading states
<div aria-busy={isLoading} aria-live="polite">
  {isLoading ? <Skeleton /> : <Content />}
</div>

// Icon-only buttons MUST have accessible labels
<button aria-label="Close dialog" onClick={onClose}>
  <XIcon className="h-4 w-4" />
</button>

// Modals / Dialogs
<div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
  <h2 id="dialog-title">Confirm Action</h2>
</div>
```

### Keyboard Navigation

- All interactive elements must be focusable and operable with keyboard
- Tab order must follow visual order (avoid positive `tabIndex`)
- Custom dropdowns and modals must trap focus
- `Escape` key should close modals and dropdowns
- shadcn/ui components handle this automatically -- do not override their keyboard behavior

```tsx
// Custom keyboard handler example
function SearchInput() {
  return (
    <input
      type="search"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.currentTarget.blur();
        }
      }}
      aria-label="Search items"
    />
  );
}
```

### Color and Contrast

- Maintain WCAG 2.1 AA contrast ratios (4.5:1 for normal text, 3:1 for large text)
- Never convey information through color alone (add icons or text labels)
- Test with browser dev tools color blindness simulators

### Reduced Motion

Respect user preferences for reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Code Review Checklist

Use this checklist when reviewing frontend pull requests:

### Correctness

- [ ] Component renders correctly in all states (loading, error, empty, populated)
- [ ] Edge cases handled (null data, empty arrays, long strings, special characters)
- [ ] No runtime errors in browser console
- [ ] SSR-safe: no `window`, `document`, or `localStorage` access during server render

### TypeScript

- [ ] No `any` types
- [ ] No non-null assertions (`!`)
- [ ] Types imported from backend where applicable
- [ ] Generic types used appropriately (not over-engineered)

### Performance

- [ ] No unnecessary re-renders (check React DevTools Profiler)
- [ ] Heavy components wrapped in `React.memo` if needed
- [ ] Expensive computations wrapped in `useMemo`
- [ ] Event handlers wrapped in `useCallback` when passed as props
- [ ] Images have explicit dimensions
- [ ] No synchronous blocking operations in render path

### Accessibility

- [ ] Semantic HTML elements used
- [ ] Interactive elements are keyboard-accessible
- [ ] Images have `alt` text
- [ ] Form inputs have associated labels
- [ ] ARIA attributes used correctly where needed
- [ ] Color contrast meets WCAG AA

### Code Quality

- [ ] No commented-out code
- [ ] No `console.log` statements (except `console.error` for real errors)
- [ ] Component follows single responsibility principle
- [ ] Hook extracts reusable logic from component
- [ ] No duplicated logic across components

### Styling

- [ ] Uses Tailwind utility classes (not inline styles)
- [ ] Responsive design works on mobile, tablet, desktop
- [ ] Dark mode supported (if applicable)
- [ ] No hardcoded pixel values for layout (use Tailwind spacing scale)
- [ ] Scrollable containers use `scrollbar-gutter: stable`

---

## Testing Guidelines

### Unit Tests (Vitest)

Use Vitest for testing utility functions, hooks, and component logic:

```typescript
// lib/__tests__/utils.test.ts
import { describe, it, expect } from "vitest";
import { formatDate, truncateText } from "@/lib/utils";

describe("formatDate", () => {
  it("formats ISO date to readable string", () => {
    expect(formatDate("2025-01-15T10:30:00Z")).toBe("Jan 15, 2025");
  });

  it("returns fallback for invalid date", () => {
    expect(formatDate("invalid")).toBe("Invalid date");
  });
});

describe("truncateText", () => {
  it("truncates text exceeding max length", () => {
    expect(truncateText("Hello World", 5)).toBe("Hello...");
  });

  it("returns full text if under max length", () => {
    expect(truncateText("Hi", 5)).toBe("Hi");
  });
});
```

### Hook Tests (Vitest + Testing Library)

```typescript
// modules/items/hooks/__tests__/use-items.test.ts
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi } from "vitest";
import { useItems } from "../use-items";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useItems", () => {
  it("fetches items successfully", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ items: [{ id: "1", name: "Test" }] }),
    } as Response);

    const { result } = renderHook(() => useItems(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(1);
  });
});
```

### End-to-End Tests (Playwright)

Use Playwright for critical user flows:

```typescript
// e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("user can sign in", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/dashboard");
  });

  test("protected route redirects to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/login");
  });
});
```

### What to Test

| Layer | Tool | What to Test |
|-------|------|-------------|
| Utility functions | Vitest | Pure logic, formatting, validation |
| Custom hooks | Vitest + RTL | Data fetching, state transitions, error handling |
| Components | Vitest + RTL | Render states, user interactions, conditional rendering |
| User flows | Playwright | Auth, navigation, form submissions, critical paths |

### What NOT to Test

- shadcn/ui component internals (they are already tested upstream)
- Tailwind class names (visual testing is better handled by Storybook or screenshot comparison)
- Third-party library behavior (test your integration, not the library)
- One-liner utility functions that are trivially correct

---

## Summary

| Category | Key Rule |
|----------|----------|
| **Performance** | Lazy-load non-critical routes; keep bundle lean |
| **TypeScript** | Strict mode, no `any`, no `!` assertions |
| **Accessibility** | Semantic HTML, keyboard navigation, ARIA where needed |
| **Testing** | Vitest for logic/hooks, Playwright for user flows |
| **Forbidden** | No inline fetch, no barrel exports, no hardcoded URLs |
| **Before Commit** | `pnpm type-check && pnpm lint && pnpm test` |
