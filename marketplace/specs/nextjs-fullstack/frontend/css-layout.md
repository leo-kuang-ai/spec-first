# CSS & Layout Best Practices

This document covers CSS patterns, layout strategies, and cross-environment compatibility considerations.

## Flexbox Patterns

### Use items-stretch on Main Flex Containers

For full-height layouts where children should fill the available space:

```typescript
// Good: items-stretch (default) allows children to fill height
<div className="flex h-screen">
  <aside className="w-64 bg-gray-100">
    {/* Sidebar fills full height */}
  </aside>
  <main className="flex-1">
    {/* Main content fills full height */}
  </main>
</div>
```

```typescript
// Bad: items-center prevents children from filling container height
<div className="flex h-screen items-center">
  <aside className="w-64 bg-gray-100">
    {/* Sidebar only as tall as its content */}
  </aside>
  <main className="flex-1">
    {/* Main content only as tall as its content */}
  </main>
</div>
```

### Nested Flex Containers

```typescript
<div className="flex h-screen flex-col">
  {/* Header - fixed height */}
  <header className="h-16 shrink-0 border-b">
    <nav>...</nav>
  </header>

  {/* Main area - fills remaining space */}
  <div className="flex min-h-0 flex-1">
    {/* Sidebar - fixed width, full height */}
    <aside className="w-64 shrink-0 overflow-y-auto border-r">
      <nav>...</nav>
    </aside>

    {/* Content - fills remaining width */}
    <main className="flex-1 overflow-y-auto">
      <div className="p-6">...</div>
    </main>
  </div>
</div>
```

### min-h-0 for Overflow Control

When using flex containers with scrollable children:

```typescript
// Without min-h-0, content may overflow
<div className="flex h-screen flex-col">
  <div className="flex-1">
    {/* This might overflow if content is tall */}
  </div>
</div>

// With min-h-0, overflow is properly contained
<div className="flex h-screen flex-col">
  <div className="min-h-0 flex-1 overflow-y-auto">
    {/* Content scrolls within container */}
  </div>
</div>
```

## Parent-Child Styling Pattern

### Parent Provides External Styles

The parent component controls:
- Positioning (absolute, relative, grid placement)
- External spacing (margin, gap)
- Size constraints (width, max-width)

```typescript
// Parent component
<div className="grid grid-cols-3 gap-4">
  <Card className="col-span-2" />  {/* Parent sets grid span */}
  <Card />
</div>
```

### Child Provides Internal Layout

The child component controls:
- Internal padding
- Internal layout (flex, grid)
- Background, borders, shadows
- Typography

```typescript
// Child component
export function Card({ className, children }: CardProps) {
  return (
    <div
      className={cn(
        // Internal styles owned by Card
        'rounded-lg border bg-white p-4 shadow-sm',
        // External styles from parent
        className
      )}
    >
      {children}
    </div>
  );
}
```

### Complete Example

```typescript
// Page layout (parent)
export function DashboardPage() {
  return (
    <div className="grid gap-6 p-6 lg:grid-cols-3">
      {/* Parent controls: grid position, external spacing */}
      <StatsCard className="lg:col-span-2" />
      <ActivityFeed className="lg:row-span-2" />
      <RecentOrders />
    </div>
  );
}

// Card component (child)
export function StatsCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        // Child controls: internal padding, background, border
        'flex flex-col gap-4 rounded-xl bg-white p-6 shadow',
        className
      )}
    >
      {/* Internal layout */}
    </div>
  );
}
```

## Cross-Environment Testing

### Dev Mode (Turbopack) vs Production (Webpack)

CSS may behave differently between development and production builds:

```bash
# Test in development (Turbopack)
pnpm dev

# Test in production (Webpack)
pnpm build && pnpm start
```

### Common Differences

1. **CSS Order**: Tailwind classes may be applied in different orders
2. **Purging**: Unused classes removed in production
3. **Minification**: Class names optimized

### Testing Checklist

- [ ] Run `pnpm dev` and test all features
- [ ] Run `pnpm build && pnpm start` and test again
- [ ] Check for visual differences
- [ ] Verify responsive breakpoints work
- [ ] Test animations and transitions

## Mobile Touch Optimization

### Disable Tap Highlight

Prevent the default blue/gray highlight on mobile tap:

```typescript
// Using Tailwind
<button className="[-webkit-tap-highlight-color:transparent]">
  Tap me
</button>

// Using inline styles (when needed)
<button style={{ WebkitTapHighlightColor: 'transparent' }}>
  Tap me
</button>

// Global reset in CSS
@layer base {
  button, a, [role="button"] {
    -webkit-tap-highlight-color: transparent;
  }
}
```

### Touch-Friendly Sizing

```typescript
// Minimum touch target: 44x44px
<button className="min-h-[44px] min-w-[44px] p-3">
  <Icon size={20} />
</button>

// For lists
<ul className="divide-y">
  {items.map((item) => (
    <li key={item.id}>
      <button className="w-full px-4 py-3 text-left">
        {item.label}
      </button>
    </li>
  ))}
</ul>
```

### Prevent Pull-to-Refresh

When implementing custom scroll behaviors:

```typescript
<div
  className="h-screen overflow-y-auto overscroll-contain"
  style={{ touchAction: 'pan-y' }}
>
  {/* Scrollable content */}
</div>
```

## Responsive Design Patterns

### Mobile-First Approach

```typescript
// Start with mobile styles, add breakpoints for larger screens
<div className="
  p-4           // Mobile: small padding
  md:p-6        // Tablet: medium padding
  lg:p-8        // Desktop: large padding
">
  <h1 className="
    text-xl       // Mobile: small heading
    md:text-2xl   // Tablet: medium heading
    lg:text-3xl   // Desktop: large heading
  ">
    Title
  </h1>
</div>
```

### Container Queries (Tailwind v4)

```typescript
// Container-based responsive styles
<div className="@container">
  <div className="
    flex flex-col
    @md:flex-row    // Row layout when container >= md
    @lg:gap-6       // Larger gap when container >= lg
  ">
    {/* Content */}
  </div>
</div>
```

### Hiding/Showing Elements

```typescript
// Hide on mobile, show on desktop
<div className="hidden lg:block">
  Desktop only content
</div>

// Show on mobile, hide on desktop
<div className="lg:hidden">
  Mobile only content
</div>
```

## Z-Index Management

### Establish a Scale

```css
/* In your CSS or Tailwind config */
:root {
  --z-dropdown: 10;
  --z-sticky: 20;
  --z-fixed: 30;
  --z-modal-backdrop: 40;
  --z-modal: 50;
  --z-popover: 60;
  --z-tooltip: 70;
}
```

### Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      zIndex: {
        dropdown: '10',
        sticky: '20',
        fixed: '30',
        modalBackdrop: '40',
        modal: '50',
        popover: '60',
        tooltip: '70',
      },
    },
  },
};
```

### Usage

```typescript
<div className="z-modal">Modal content</div>
<div className="z-tooltip">Tooltip</div>
```

## Animation Best Practices

### Use CSS Transitions

```typescript
<button className="
  transition-colors duration-200 ease-out
  hover:bg-primary-dark
">
  Hover me
</button>
```

### Respect Motion Preferences

```typescript
// Disable animations for users who prefer reduced motion
<div className="
  transition-transform duration-300
  motion-reduce:transition-none
  hover:scale-105
  motion-reduce:hover:scale-100
">
  Animated element
</div>
```

### Hardware Acceleration

```typescript
// Use transform for smooth animations
<div className="
  translate-x-0 transition-transform
  group-hover:translate-x-2
">
  Slides on hover
</div>
```

## Best Practices Summary

1. **items-stretch**: Default for main flex containers
2. **Parent External, Child Internal**: Clear separation of concerns
3. **Test Both Modes**: Always verify in dev AND production
4. **Touch Optimization**: Disable tap highlight, ensure touch targets
5. **Mobile First**: Build up from smallest screens
6. **Consistent Z-Index**: Use a defined scale
7. **Respect Accessibility**: Honor motion preferences
