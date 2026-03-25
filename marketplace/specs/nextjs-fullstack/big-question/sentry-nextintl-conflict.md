# Sentry and next-intl Build Configuration Conflict

## Problem

Production builds fail with the error:

```
Error: Couldn't find next-intl config file
```

or

```
Error: Failed to collect page data for /[locale]/page
```

The build works fine in development mode but fails during `next build`.

## Root Cause

The `withSentryConfig` wrapper in `next.config.js` interferes with other Next.js plugins, particularly `next-intl`'s plugin (`createNextIntlPlugin`).

### Technical Details

When you chain multiple config wrappers:

```javascript
// next.config.js - Problematic configuration
import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig = {
  // your config
};

// This chaining causes conflicts
export default withSentryConfig(withNextIntl(nextConfig), {
  // Sentry options
});
```

The issue occurs because:

1. **Plugin execution order matters** - Sentry's wrapper modifies the webpack configuration in ways that can break other plugins' assumptions
2. **Build-time vs runtime** - Some plugins expect to run at specific build phases
3. **Config mutation** - Wrappers may mutate the config object in incompatible ways

Specifically, `withSentryConfig`:
- Modifies webpack configuration extensively
- Adds custom loaders and plugins
- May interfere with `next-intl`'s message loading mechanism

## Solution

### Solution 1: Remove withSentryConfig Wrapper (Recommended)

Sentry's runtime features still work via `instrumentation.ts` without the config wrapper:

```javascript
// next.config.js - Fixed configuration
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig = {
  // your config
};

// Only use next-intl wrapper, no Sentry wrapper
export default withNextIntl(nextConfig);
```

**Why Sentry still works:**

The `withSentryConfig` wrapper is primarily for:
- Source map uploading
- Build-time instrumentation
- Release management

However, Sentry's core error tracking works through `instrumentation.ts`:

```typescript
// instrumentation.ts
import * as Sentry from "@sentry/nextjs";

export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 1.0,
      // ... other options
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 1.0,
    });
  }
}
```

### Solution 2: Use Sentry Without Source Maps

If you need some Sentry build features but want to avoid conflicts:

```javascript
// next.config.js
import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig = {
  // your config
};

// Apply next-intl first
const configWithIntl = withNextIntl(nextConfig);

// Conditionally apply Sentry only if not causing issues
const finalConfig = process.env.SKIP_SENTRY_BUILD
  ? configWithIntl
  : withSentryConfig(configWithIntl, {
      silent: true,
      disableSourceMapUpload: true, // Disable problematic feature
    });

export default finalConfig;
```

### Solution 3: Alternative Plugin Order

Sometimes reversing the wrapper order helps:

```javascript
// Try applying Sentry first, then next-intl
const configWithSentry = withSentryConfig(nextConfig, sentryOptions);
export default withNextIntl(configWithSentry);
```

**Note:** This may or may not work depending on your specific versions.

### Solution 4: Separate Sentry Configuration

Use Sentry CLI for source map upload instead of the webpack plugin:

```bash
# In your CI/CD pipeline after build
npx @sentry/cli sourcemaps upload ./next/static --org your-org --project your-project
```

```javascript
// next.config.js - Clean configuration
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig = {
  productionBrowserSourceMaps: true, // Enable source maps for Sentry CLI
};

export default withNextIntl(nextConfig);
```

## Verification Steps

After applying the fix:

1. **Clean build artifacts:**
   ```bash
   rm -rf .next node_modules/.cache
   ```

2. **Test production build:**
   ```bash
   pnpm build
   ```

3. **Verify Sentry works in production:**
   ```bash
   pnpm start
   # Trigger a test error and check Sentry dashboard
   ```

4. **Test i18n routing:**
   ```bash
   # Visit different locale routes
   curl http://localhost:3000/en/page
   curl http://localhost:3000/de/page
   ```

## Key Takeaways

1. **Plugin wrappers can conflict** - Be cautious when combining multiple Next.js config wrappers

2. **Sentry works without withSentryConfig** - Core error tracking functions via `instrumentation.ts`

3. **Order matters** - Try different wrapper orders if you must use multiple plugins

4. **Source maps are optional** - You can still get stack traces without source map upload

5. **Test builds locally** - Always run `pnpm build` before deploying

6. **Keep dependencies updated** - Plugin compatibility issues are often fixed in newer versions

## Version Information

This issue was observed with:
- Next.js 14.x / 15.x
- @sentry/nextjs 7.x / 8.x
- next-intl 3.x

Check the respective changelogs for compatibility updates.

## Related Resources

- [Sentry Next.js SDK Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [next-intl Plugin Documentation](https://next-intl-docs.vercel.app/docs/getting-started/app-router)
- [Next.js Configuration](https://nextjs.org/docs/app/api-reference/next-config-js)
