# Turbopack vs Webpack Flexbox Layout Differences

## Problem

Layout works correctly in development mode (Turbopack) but breaks in production (Webpack). Specifically, flex containers and their children behave differently between the two bundlers.

**Symptoms:**
- Components have correct height in dev mode but collapse or overflow in production
- Scrollable areas work in dev but fail in prod
- Nested flex layouts display differently between environments

## Root Cause

Turbopack (Next.js dev mode default) and Webpack (production build) have subtle differences in how they process CSS, particularly regarding flexbox behavior:

1. **Turbopack is stricter** about explicit flexbox properties
2. **Webpack may auto-infer** certain flex child behaviors that Turbopack does not
3. The difference lies in how CSS is compiled and applied, not in the CSS specification itself

### Technical Details

When a flex container has `flex-direction: column` and children that need to fill available space, the behavior depends on:

- The `align-items` property (defaults to `stretch` but may not be consistently applied)
- Whether children have explicit `height` or `flex` properties
- The interaction between nested flex containers

**Example of problematic layout:**

```tsx
// Parent component
<div className="flex flex-col h-screen">
  <Header /> {/* Fixed height */}
  <main className="flex-1 flex"> {/* Should fill remaining space */}
    <Sidebar />
    <Content /> {/* Should scroll internally */}
  </main>
</div>
```

In Turbopack, the `main` element might not properly pass its height to children without explicit `items-stretch`.

## Solution

### 1. Explicitly Set `items-stretch` on Flex Containers

Add `items-stretch` to main flex containers that need children to fill available space:

```tsx
// Before (inconsistent between Turbopack/Webpack)
<div className="flex flex-col h-screen">
  <main className="flex-1 flex">
    {/* children */}
  </main>
</div>

// After (consistent behavior)
<div className="flex flex-col h-screen items-stretch">
  <main className="flex-1 flex items-stretch">
    {/* children */}
  </main>
</div>
```

### 2. Apply Parent/Child Responsibility Separation

Follow a clear pattern for layout responsibilities:

**Parent's Responsibility:**
- Define the flex container (`flex`, `flex-col`, `flex-row`)
- Set alignment (`items-stretch`, `justify-between`)
- Control overall dimensions (`h-screen`, `w-full`)

**Child's Responsibility:**
- Define its own flex behavior (`flex-1`, `flex-shrink-0`)
- Handle internal overflow (`overflow-auto`, `overflow-hidden`)
- Set min/max constraints (`min-h-0`, `max-w-full`)

### 3. Use `min-h-0` for Scrollable Flex Children

When a flex child needs internal scrolling:

```tsx
<div className="flex flex-col h-full items-stretch">
  <div className="flex-shrink-0">Fixed Header</div>
  <div className="flex-1 min-h-0 overflow-auto">
    {/* Scrollable content */}
  </div>
</div>
```

The `min-h-0` is crucial because flex items default to `min-height: auto`, which can prevent overflow from working correctly.

### Complete Example

```tsx
// App layout with consistent dev/prod behavior
function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen items-stretch">
      {/* Fixed navigation */}
      <nav className="flex-shrink-0 h-16 border-b">
        <Navigation />
      </nav>

      {/* Main content area */}
      <div className="flex-1 flex items-stretch min-h-0">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 border-r overflow-auto">
          <SidebarContent />
        </aside>

        {/* Main content with internal scroll */}
        <main className="flex-1 min-w-0 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
```

## Key Takeaways

1. **Always test production builds locally** before deployment using `pnpm build && pnpm start`

2. **Be explicit with flexbox properties** - Don't rely on browser defaults or bundler behavior

3. **Use `items-stretch` explicitly** on containers where children need to fill space

4. **Remember `min-h-0` and `min-w-0`** for scrollable flex children

5. **Separate layout responsibilities** between parent (container behavior) and child (self behavior)

6. **Document layout patterns** in your project to ensure consistency across the team

## Related Resources

- [CSS Flexbox Guide](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)
- [Next.js Turbopack Documentation](https://nextjs.org/docs/architecture/turbopack)
- [Tailwind CSS Flexbox Utilities](https://tailwindcss.com/docs/flex)
