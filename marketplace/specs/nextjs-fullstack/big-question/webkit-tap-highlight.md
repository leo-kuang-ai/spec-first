# WebKit Tap Highlight and Border-Radius Issues on Mobile

## Problem

Buttons and interactive elements lose their `border-radius` styling when tapped on mobile devices (iOS Safari, Chrome on iOS). The element briefly shows a rectangular highlight instead of respecting the rounded corners.

**Symptoms:**
- Button appears with sharp corners during tap/touch
- A blue or gray rectangular overlay flashes on touch
- The visual glitch only occurs on WebKit-based mobile browsers
- Desktop browsers and Android Chrome don't show the issue

## Root Cause

WebKit browsers apply a default tap highlight effect to interactive elements. This highlight:

1. **Ignores `border-radius`** - The highlight is applied as a simple rectangular overlay
2. **Uses system default color** - Typically a semi-transparent blue or gray
3. **Overrides visual styling** - The highlight appears on top of your custom styles

### Technical Details

When you tap an element on iOS Safari:

```css
/* WebKit's default behavior (pseudo-representation) */
element:active {
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
  /* This creates a RECTANGULAR overlay, ignoring border-radius */
}
```

The tap highlight is rendered as a separate layer that doesn't respect the element's `border-radius`, `clip-path`, or other shape-defining properties.

## Solution

### Solution 1: Disable Tap Highlight + Wrapper with Overflow Hidden

The most reliable solution combines two techniques:

```tsx
// Button component with proper mobile touch handling
function Button({ children, className, ...props }: ButtonProps) {
  return (
    <div className="rounded-lg overflow-hidden inline-block">
      <button
        className={cn("rounded-lg px-4 py-2 bg-blue-500 text-white", className)}
        style={{ WebkitTapHighlightColor: "transparent" }}
        {...props}
      >
        {children}
      </button>
    </div>
  );
}
```

**Why this works:**
1. `WebkitTapHighlightColor: "transparent"` removes the default highlight
2. The wrapper `div` with `overflow-hidden` clips any remaining visual artifacts
3. Both elements have matching `border-radius` for consistent appearance

### Solution 2: CSS-Only Approach

If you can't modify the component structure:

```css
/* In your global CSS */
.tap-safe {
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}

/* Custom active state to replace the highlight */
.tap-safe:active {
  opacity: 0.8;
  transform: scale(0.98);
}
```

```tsx
<button className="tap-safe rounded-lg px-4 py-2 bg-blue-500">
  Click me
</button>
```

### Solution 3: Tailwind CSS Utility Class

Add a reusable utility in your Tailwind config:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {},
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        '.tap-highlight-none': {
          '-webkit-tap-highlight-color': 'transparent',
        },
      });
    },
  ],
};
```

Then use it in components:

```tsx
<button className="tap-highlight-none rounded-lg px-4 py-2">
  Click me
</button>
```

### Solution 4: Wrapper Component for Consistent Behavior

Create a reusable wrapper for all interactive rounded elements:

```tsx
// components/ui/touch-safe-wrapper.tsx
interface TouchSafeWrapperProps {
  children: React.ReactNode;
  className?: string;
  borderRadius?: string;
}

export function TouchSafeWrapper({
  children,
  className,
  borderRadius = "rounded-lg"
}: TouchSafeWrapperProps) {
  return (
    <div className={cn(borderRadius, "overflow-hidden inline-flex", className)}>
      {children}
    </div>
  );
}

// Usage
<TouchSafeWrapper>
  <button
    className="rounded-lg px-4 py-2 bg-blue-500"
    style={{ WebkitTapHighlightColor: "transparent" }}
  >
    Click me
  </button>
</TouchSafeWrapper>
```

### Complete Example: Card with Clickable Areas

```tsx
function ProductCard({ product }: { product: Product }) {
  return (
    <div className="rounded-xl border p-4">
      <h3>{product.name}</h3>
      <p>{product.description}</p>

      {/* Action buttons with tap-safe handling */}
      <div className="flex gap-2 mt-4">
        <div className="rounded-lg overflow-hidden">
          <button
            className="rounded-lg px-4 py-2 bg-blue-500 text-white"
            style={{ WebkitTapHighlightColor: "transparent" }}
            onClick={() => addToCart(product)}
          >
            Add to Cart
          </button>
        </div>

        <div className="rounded-lg overflow-hidden">
          <button
            className="rounded-lg px-4 py-2 border border-gray-300"
            style={{ WebkitTapHighlightColor: "transparent" }}
            onClick={() => viewDetails(product)}
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
}
```

## Key Takeaways

1. **WebKit tap highlight ignores border-radius** - This is browser behavior, not a CSS bug

2. **Always set `WebkitTapHighlightColor: "transparent"`** on interactive elements with rounded corners

3. **Use a wrapper with `overflow-hidden`** for the most reliable visual clipping

4. **Test on actual iOS devices** - Simulators and browser dev tools may not reproduce the issue

5. **Consider adding custom active states** to replace the removed tap feedback for better UX

6. **Create reusable components** that handle mobile touch behavior consistently

## Browser Support Notes

| Browser | Needs Fix |
|---------|-----------|
| iOS Safari | Yes |
| Chrome on iOS | Yes (uses WebKit) |
| Firefox on iOS | Yes (uses WebKit) |
| Android Chrome | Usually no |
| Desktop browsers | No |

## Related Resources

- [MDN: -webkit-tap-highlight-color](https://developer.mozilla.org/en-US/docs/Web/CSS/-webkit-tap-highlight-color)
- [WebKit Bug Tracker](https://bugs.webkit.org/)
- [CSS Tricks: Handling Touch Events](https://css-tricks.com/snippets/css/remove-gray-highlight-when-tapping-links-in-mobile-safari/)
