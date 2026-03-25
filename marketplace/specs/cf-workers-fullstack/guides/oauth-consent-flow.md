# OAuth 2.1 Consent Flow Design Pattern

> **Purpose**: Design pattern for OAuth 2.1 authorization with resource selection (e.g., workspace, organization, project)

---

## Overview

This flow pattern handles OAuth 2.1 authorization where users must select a resource scope before granting access. The pattern applies to any application where:

- OAuth tokens are user-level
- Operations require a resource-level context (workspace, organization, project, etc.)

---

## Architecture Layers

| Layer           | Responsibility                                 |
| --------------- | ---------------------------------------------- |
| External Client | Initiates OAuth flow                           |
| API Routes      | OAuth protocol endpoints (`/oauth/*`)          |
| Frontend Routes | Consent UI with resource selection (`/auth/*`) |
| Auth Middleware | User session validation                        |
| KV Storage      | Store clients, codes, tokens                   |
| Database        | User and resource data                         |

---

## Data Flow

```
External Client
       |
       | 1. GET /.well-known/oauth-authorization-server
       v
+------------------+
| OAuth Metadata   |---> Returns issuer, endpoints
+------------------+
       |
       | 2. POST /oauth/register (Dynamic Client Registration)
       v
+------------------+
| Client Registry  |---> Stores client, returns client_id
+------------------+
       |
       | 3. GET /oauth/authorize?client_id=...&redirect_uri=...
       v
+------------------+     +------------------+
| Authorization    |---->| Session Check    |
| Endpoint         |     | (Auth Middleware)|
+------------------+     +------------------+
       |
       | 4a. No session -> Redirect to /login?return_to=...
       | 4b. Has session -> Redirect to /auth/consent
       v
+------------------+
| Consent Page     |---> Displays resource selection UI
| (Frontend)       |
+------------------+
       |
       | 5. User selects resource, clicks "Allow"
       |    POST /oauth/authorize (form submit)
       v
+------------------+
| Authorization    |---> Generates authorization code
| Consent Handler  |---> Stores code with resourceId in props
+------------------+
       |
       | 6. Redirect to client: redirect_uri?code=...&state=...
       v
External Client
       |
       | 7. POST /oauth/token (code + code_verifier)
       v
+------------------+
| Token Endpoint   |---> Validates code, PKCE
|                  |---> Generates access_token with resourceId
+------------------+
       |
       | 8. Returns { access_token, token_type, expires_in }
       v
External Client
       |
       | 9. API requests with Authorization: Bearer <token>
       v
+------------------+
| API Endpoint     |---> Validates token, extracts resourceId
|                  |---> Operations scoped to bound resource
+------------------+
```

---

## Critical Design Decisions

### 1. Route Namespace Separation

**Problem**: API routes and frontend routes can conflict.

**Solution**: Use separate namespaces:

- `/oauth/*` -> API (OAuth protocol endpoints)
- `/auth/*` -> Frontend (consent pages)

**Why this matters**: Route mounting like `app.route("/oauth", oauthRouter)` matches ALL `/oauth/*` paths, preventing frontend framework from handling `/oauth/consent`.

```typescript
// BAD: Consent page at /oauth/consent conflicts with API's /oauth/*
app.route("/oauth", oauthRouter); // Matches /oauth/consent first!
// Frontend router never sees /oauth/consent

// GOOD: Consent page at /auth/oauth-consent avoids conflict
app.route("/oauth", oauthRouter); // Only handles /oauth/*
// Frontend router handles /auth/oauth-consent
```

### 2. Explicit Route Registration

**Problem**: New frontend pages return 404.

**Solution**: If using explicit route configuration, add routes to your routes file:

```typescript
// routes.ts - MUST add new routes here
const routes: RouteConfig = [
  // ... existing routes
  route("auth/oauth-consent", "routes/auth.oauth-consent.tsx"),
];
```

### 3. Resource Binding in OAuth Flow

**Problem**: OAuth tokens are user-level, but operations require a resource context.

**Solution**: Let users select resource during OAuth consent:

1. `/oauth/authorize` redirects to consent page
2. Consent page shows user's available resources
3. User selects resource -> stored in authorization code props
4. Token exchange preserves resourceId in access token props
5. Token validation extracts resourceId from token

```typescript
// Authorization code stores resource selection
const authorizationCode = {
  // ... other fields
  props: {
    resourceId: selectedResourceId, // User's choice
  },
};

// Access token inherits resource binding
const accessToken = {
  // ... other fields
  props: authorizationCode.props, // Includes resourceId
};

// API session uses bound resource
const session = {
  activeResourceId: tokenData.props.resourceId,
};
```

---

## Data Formats

### OAuth Client (stored in KV)

```typescript
{
  clientId: "client_xxx",
  clientSecret: "xxx",  // optional for public clients
  clientName: "My App",
  redirectUris: ["https://example.com/callback"],
  grantTypes: ["authorization_code", "refresh_token"],
  responseTypes: ["code"],
  tokenEndpointAuthMethod: "none",  // or "client_secret_basic"
  createdAt: 1702800000000,
}
```

### Authorization Code (stored in KV, TTL 10 min)

```typescript
{
  code: "xxx",
  clientId: "client_xxx",
  redirectUri: "https://example.com/callback",
  userId: "user_xxx",
  scope: "read write",
  codeChallenge: "xxx",
  codeChallengeMethod: "S256",
  expiresAt: 1702800600000,
  props: {
    resourceId: "resource_xxx",  // User's selection
  },
}
```

### Access Token (stored in KV, TTL 1 hour)

```typescript
{
  tokenHash: "xxx",  // SHA-256 of actual token
  clientId: "client_xxx",
  userId: "user_xxx",
  scope: "read write",
  expiresAt: 1702804200000,
  props: {
    resourceId: "resource_xxx",  // Inherited from auth code
  },
}
```

---

## Edge Cases

| Case                       | Handling                                            |
| -------------------------- | --------------------------------------------------- |
| User not logged in         | Redirect to `/login?return_to=/oauth/authorize?...` |
| User has no resources      | Show message, disable "Allow" button                |
| User has one resource      | Auto-select, still show consent UI for confirmation |
| User denies consent        | Redirect to client with `error=access_denied`       |
| Invalid redirect_uri       | Return 400 error (never redirect to untrusted URI)  |
| Expired authorization code | Return 400 `invalid_grant`                          |
| Invalid PKCE verifier      | Return 400 `invalid_grant`                          |

---

## Implementation Checklist

- [ ] Separate `/oauth/*` (API) and `/auth/*` (frontend) namespaces
- [ ] Register consent page in frontend routes
- [ ] Store resourceId in authorization code props
- [ ] Transfer props from auth code to access token
- [ ] Extract resourceId in token validation middleware
- [ ] Handle edge cases (no resources, single resource, denied)
- [ ] CORS headers for browser-based OAuth clients

---

## Key Lessons

1. **Route namespaces matter**: API routes and frontend routes must not overlap
2. **Explicit route registration**: Always add new pages to your routes config
3. **Resource context for OAuth**: User-level OAuth needs resource-level binding for scoped operations
4. **CORS for OAuth endpoints**: Browser-based OAuth clients need CORS headers

---

**Language**: All documentation must be written in **English**.
