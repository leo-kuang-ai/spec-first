# Focus Requirements

## 1. Background
- Source requirement: clarify profile page copy on web account settings
- Current owner: `profile-web`
- Workspace context: `account-web` contains the profile page and related copy strings
- Goal of this document: narrow the reviewed copy-change demand into a direct owner-scoped requirement for downstream review

## 2. Owner Scope
- One-sentence scope: update profile page title, description, and save success toast copy on web profile settings
- Covered modules/pages/domains: web profile page, profile save success toast, page-level explanatory copy
- Explicit boundary: this owner only updates approved web copy; layout, behavior, backend, analytics, and non-web clients are outside scope

## 3. In Scope
- Update page title from `Account Settings` to `Profile Information`
- Update profile description text to the approved new wording
- Update save success toast copy to `Profile updated`

## 4. Out of Scope
- Any backend or API changes
- Mobile or app copy parity
- Layout adjustments
- Interaction or validation behavior changes
- Analytics or tracking changes

## 5. Relevant Flows
- Happy path:
  - user opens profile page
  - user sees updated title and description copy
  - user saves profile changes
  - user sees updated success toast copy
- Edge or exception paths:
  - none introduced by this demand beyond existing profile save behavior

## 6. Dependencies
- Team/module dependencies: none beyond normal review and release flow
- Interface/data dependencies: none
- External platform/config dependencies: none
- Dependency status: no external dependency blocking this owner scope

## 7. Acceptance Criteria
- Profile page header displays `Profile Information`
- Profile page description displays the approved new explanatory text
- Successful profile save shows `Profile updated`
- No other profile page behavior changes are introduced by this requirement

## 8. Non-Functional Constraints
- Known constraints: copy update must preserve existing layout and interaction behavior
- Constraints requiring later technical planning: none
- Unresolved constraints: none

## 9. Assumptions
- Existing i18n or copy storage path can support the updated strings without schema changes
- Existing toast component remains unchanged apart from the success message text

## 10. Open Questions
- Blocking questions:
  - none
- Non-blocking questions:
  - should non-web clients adopt the same wording in a later iteration?
