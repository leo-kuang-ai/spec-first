# CSS/Styling Debugging Thinking Guide

> Stop guessing. Measure first.

---

## The Problem

CSS bugs are deceptive. Visual symptoms often mislead us:

| Visual Symptom | Intuitive Guess | Actual Cause (Example) |
|---------------|-----------------|------------------------|
| "Element behind another" | z-index issue | Background is transparent |
| "Styles not applying" | Specificity issue | CSS variable undefined |
| "Layout broken" | Flexbox/Grid issue | Parent has overflow:hidden |
| "Colors wrong" | Theme issue | Variable namespace mismatch |

**Root cause**: We debug based on **what we see** instead of **what the browser computed**.

---

## The Golden Rule

> **ALWAYS check computed styles before attempting a fix.**

```javascript
// In browser console
getComputedStyle(element).backgroundColor  // Check actual value
getComputedStyle(element).zIndex           // Not "auto" vs actual number
getComputedStyle(element).position         // static vs relative vs fixed
```

This takes 10 seconds and saves hours of wrong-direction debugging.

---

## Debugging Decision Tree

```
Visual bug observed
       │
       ▼
┌─────────────────────────────────────┐
│ Step 1: Inspect computed styles     │
│ - What is the ACTUAL value?         │
│ - Is it what you expected?          │
└─────────────────────────────────────┘
       │
       ▼
   Is the value wrong?
       │
   ┌───┴───┐
   │       │
  YES      NO
   │       │
   ▼       ▼
┌──────┐  ┌──────────────────────────┐
│ Why? │  │ Problem is elsewhere      │
│      │  │ - Parent element?         │
│      │  │ - Sibling element?        │
│      │  │ - Stacking context?       │
└──────┘  └──────────────────────────┘
   │
   ▼
┌─────────────────────────────────────┐
│ Step 2: Trace the CSS source        │
│ - Is the class applied?             │
│ - Is the CSS variable defined?      │
│ - Is there a specificity override?  │
└─────────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────────┐
│ Step 3: Fix at the source           │
│ - Don't add !important as first try │
│ - Fix the root cause                │
└─────────────────────────────────────┘
```

---

## Common Traps

### Trap 1: "It must be z-index"

**Symptom**: Element appears behind another

**Wrong approach**: Keep increasing z-index

**Right approach**:
1. Check if background is actually transparent (`rgba(0,0,0,0)`)
2. Check if elements are in same stacking context
3. Check position property (z-index only works on positioned elements)

### Trap 2: "The class isn't working"

**Symptom**: `bg-popover` doesn't give background color

**Wrong approach**: Add inline styles or more classes

**Right approach**:
1. Check if `--color-popover` CSS variable exists
2. Check if class is actually applied (DevTools Elements tab)
3. Check for specificity conflicts

### Trap 3: "It works in isolation"

**Symptom**: Component looks fine alone, breaks in context

**Wrong approach**: Debug the component in isolation

**Right approach**:
1. Check parent's overflow, position, transform properties
2. Check if parent creates new stacking context
3. Check for inherited styles

---

## CSS Variable Debugging

Modern CSS uses variables heavily. Debug them systematically:

```javascript
// Check if variable is defined
getComputedStyle(document.documentElement).getPropertyValue('--popover')

// Check what value a class resolves to
getComputedStyle(element).backgroundColor  // Should NOT be rgba(0,0,0,0)
```

### Tailwind v4 Specific

Tailwind v4 uses `--color-*` namespace. If you define:
```css
:root {
  --popover: 0 0% 100%;  /* HSL value */
}
```

But use `bg-popover`, it looks for `--color-popover`, not `--popover`.

**Solution**: Map variables in `@theme` block:
```css
@theme {
  --color-popover: hsl(var(--popover));
}
```

---

## Stacking Context Checklist

z-index problems are usually stacking context problems.

**What creates a new stacking context?**
- [ ] `position: relative/absolute/fixed` with `z-index` set
- [ ] `opacity` < 1
- [ ] `transform` (any value except none)
- [ ] `filter` (any value except none)
- [ ] `isolation: isolate`
- [ ] `will-change` (certain values)

**Key insight**: Elements can only be compared within the SAME stacking context.

```
Root
├── Header (z-index: 10, creates context)
│   └── Dropdown (z-index: 9999) ← trapped inside Header's context!
└── Main (z-index: 1)
    └── Content ← Dropdown can't go above this if Header's z < Main's z
```

---

## Quick Debug Commands

```javascript
// In browser console:

// 1. Check actual background color
getComputedStyle($0).backgroundColor

// 2. Check z-index and position
console.log({
  zIndex: getComputedStyle($0).zIndex,
  position: getComputedStyle($0).position
})

// 3. Check CSS variable value
getComputedStyle(document.documentElement).getPropertyValue('--popover')

// 4. Highlight element to see actual bounds
$0.style.outline = '2px solid red'

// 5. Check all stacking context ancestors
let el = $0;
while (el) {
  const style = getComputedStyle(el);
  if (style.zIndex !== 'auto' || style.opacity !== '1' ||
      style.transform !== 'none' || style.isolation === 'isolate') {
    console.log(el, { zIndex: style.zIndex, opacity: style.opacity });
  }
  el = el.parentElement;
}
```

---

## Prevention Checklist

Before shipping CSS changes:

- [ ] Tested in light mode AND dark mode
- [ ] Tested with dropdown/popover OPEN
- [ ] Checked computed values match expectations
- [ ] No `!important` added (unless absolutely necessary)
- [ ] CSS variables are defined in correct namespace

---

## Key Takeaways

1. **Measure before guessing** - `getComputedStyle()` is your friend
2. **Transparent is not invisible** - `rgba(0,0,0,0)` means no background
3. **z-index is not absolute** - It's relative to stacking context
4. **CSS variables have namespaces** - Tailwind v4 uses `--color-*`
5. **10 seconds of inspection saves hours of trial-and-error**

---

## Related

- [Dependency Versions](../shared/dependency-versions.md) - Tailwind v4 color variable issues
- [Frontend Authentication](../frontend/authentication.md) - better-auth-ui styling
