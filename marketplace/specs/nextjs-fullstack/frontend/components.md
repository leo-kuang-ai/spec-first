# Component Development Guidelines

This document covers component development patterns including Server vs Client components, semantic HTML, and UI best practices.

## Server vs Client Components

### Default to Server Components

Next.js App Router defaults to Server Components. Use them for:

- Data fetching
- Accessing backend resources directly
- Keeping sensitive data on the server
- Reducing client-side JavaScript

```typescript
// app/(app)/dashboard/page.tsx (Server Component)
import { DashboardStats } from '@/modules/dashboard/components';

export default async function DashboardPage() {
  // Can fetch data directly
  const stats = await fetchDashboardStats();

  return (
    <main>
      <h1>Dashboard</h1>
      <DashboardStats data={stats} />
    </main>
  );
}
```

### When to Use Client Components

Add `'use client'` directive only when you need:

- Event handlers (onClick, onChange, etc.)
- useState, useEffect, or other React hooks
- Browser-only APIs (localStorage, window)
- Class components with lifecycle methods

```typescript
'use client';

import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
```

### Composition Pattern

Keep Server Components at the top, push Client Components down:

```typescript
// Server Component (page.tsx)
import { ProductList } from './ProductList';
import { FilterSidebar } from './FilterSidebar'; // Client

export default async function ProductsPage() {
  const products = await fetchProducts();

  return (
    <div className="flex">
      <FilterSidebar /> {/* Client component for interactivity */}
      <ProductList products={products} /> {/* Can be server or client */}
    </div>
  );
}
```

### Passing Server Data to Client Components

```typescript
// Server Component
export default async function Page() {
  const initialData = await fetchData();

  return <InteractiveWidget initialData={initialData} />;
}

// Client Component
'use client';

export function InteractiveWidget({ initialData }: { initialData: Data }) {
  const [data, setData] = useState(initialData);
  // Interactive logic...
}
```

## Semantic HTML

### Use Proper Elements

```typescript
// Bad: div for everything
<div onClick={handleClick}>Click me</div>
<div>
  <div>Item 1</div>
  <div>Item 2</div>
</div>

// Good: semantic elements
<button onClick={handleClick}>Click me</button>
<ul>
  <li>Item 1</li>
  <li>Item 2</li>
</ul>
```

### Button vs Div

Always use `<button>` for clickable actions:

```typescript
// Bad: Non-semantic, no keyboard support, no accessibility
<div
  className="cursor-pointer"
  onClick={handleClick}
>
  Save
</div>

// Good: Semantic, keyboard accessible, proper focus
<button
  type="button"
  onClick={handleClick}
  className="..."
>
  Save
</button>
```

### Form Elements

```typescript
// Bad: Missing labels, wrong elements
<div>
  <span>Email</span>
  <input type="text" />
</div>

// Good: Proper form structure
<div>
  <label htmlFor="email">Email</label>
  <input
    id="email"
    type="email"
    aria-describedby="email-error"
  />
  {error && <p id="email-error" role="alert">{error}</p>}
</div>
```

### Navigation

```typescript
// Bad
<div onClick={() => router.push('/about')}>About</div>

// Good
<Link href="/about">About</Link>

// For programmatic navigation with button appearance
<Link href="/about" className="btn btn-primary">
  About
</Link>
```

## Next.js Image Component

### Always Use next/image

```typescript
// Bad: Raw img tag
<img src="/hero.jpg" alt="Hero" />

// Good: Optimized Image component
import Image from 'next/image';

<Image
  src="/hero.jpg"
  alt="Hero image"
  width={1200}
  height={600}
  priority // For above-the-fold images
/>
```

### Responsive Images

```typescript
// Fill container
<div className="relative h-64 w-full">
  <Image
    src="/banner.jpg"
    alt="Banner"
    fill
    className="object-cover"
    sizes="(max-width: 768px) 100vw, 50vw"
  />
</div>
```

### Remote Images

Configure domains in `next.config.js`:

```javascript
// next.config.js
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.example.com',
      },
    ],
  },
};
```

## Command Palette (cmdk)

### Basic Implementation

```typescript
'use client';

import { Command } from 'cmdk';
import { useState, useEffect } from 'react';

export function CommandPalette() {
  const [open, setOpen] = useState(false);

  // Toggle with keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Global Command Menu"
    >
      <Command.Input placeholder="Type a command or search..." />
      <Command.List>
        <Command.Empty>No results found.</Command.Empty>

        <Command.Group heading="Navigation">
          <Command.Item onSelect={() => router.push('/dashboard')}>
            Go to Dashboard
          </Command.Item>
          <Command.Item onSelect={() => router.push('/settings')}>
            Go to Settings
          </Command.Item>
        </Command.Group>

        <Command.Group heading="Actions">
          <Command.Item onSelect={handleNewOrder}>
            Create New Order
          </Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
```

### With Search Results

```typescript
export function SearchCommandPalette() {
  const [search, setSearch] = useState('');
  const { data: results, isLoading } = useSearch(search);

  return (
    <Command.Dialog open={open} onOpenChange={setOpen}>
      <Command.Input
        value={search}
        onValueChange={setSearch}
        placeholder="Search..."
      />
      <Command.List>
        {isLoading && <Command.Loading>Searching...</Command.Loading>}

        <Command.Empty>No results found.</Command.Empty>

        {results?.map((item) => (
          <Command.Item
            key={item.id}
            value={item.title}
            onSelect={() => handleSelect(item)}
          >
            {item.title}
          </Command.Item>
        ))}
      </Command.List>
    </Command.Dialog>
  );
}
```

## Styling with Tailwind

### Component Styling Pattern

```typescript
// Use className for styling
export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-4 shadow-sm',
        className
      )}
    >
      {children}
    </div>
  );
}
```

### Conditional Styles

```typescript
import { cn } from '@/lib/utils';

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium',
        // Variants
        {
          'bg-primary text-primary-foreground': variant === 'primary',
          'bg-secondary text-secondary-foreground': variant === 'secondary',
          'border bg-transparent': variant === 'outline',
        },
        // Sizes
        {
          'h-8 px-3 text-sm': size === 'sm',
          'h-10 px-4': size === 'md',
          'h-12 px-6 text-lg': size === 'lg',
        },
        className
      )}
      {...props}
    />
  );
}
```

### Responsive Design

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map((item) => (
    <Card key={item.id}>{item.content}</Card>
  ))}
</div>
```

## Accessibility

### Focus Management

```typescript
export function Modal({ open, onClose, children }: ModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      closeButtonRef.current?.focus();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        {children}
        <button ref={closeButtonRef} onClick={onClose}>
          Close
        </button>
      </DialogContent>
    </Dialog>
  );
}
```

### ARIA Labels

```typescript
<button
  aria-label="Close dialog"
  aria-expanded={isOpen}
  aria-controls="dropdown-menu"
>
  <CloseIcon />
</button>

<div
  id="dropdown-menu"
  role="menu"
  aria-hidden={!isOpen}
>
  {/* Menu items */}
</div>
```

## Best Practices

1. **Server First**: Default to Server Components
2. **Semantic HTML**: Use the right element for the job
3. **Optimize Images**: Always use next/image
4. **Accessibility**: Include ARIA labels and keyboard support
5. **Type Props**: Define TypeScript interfaces for all props
6. **Composition**: Break large components into smaller pieces

## Anti-Patterns

- Using `div` for buttons and links
- Using `img` instead of `next/image`
- Adding `'use client'` at the top of every file
- Inline styles instead of Tailwind classes
- Missing accessibility attributes
- Components with too many responsibilities
