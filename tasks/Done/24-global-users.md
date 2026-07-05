# 24 — Global User Registry with Group Membership

## Summary

Decouple users from groups. Users become **global entities** that exist independently. Group membership is a separate concept — a `MEMBER_ADDED` (or `MEMBERSHIP_CREATED`) event links a global user to a group.

---

## Motivation

Currently, members are scoped per-group — the same person added to two groups has two separate member IDs, no way to identify them as the same person. This prevents cross-group features (e.g., settling debts across groups, seeing all groups a person is in) and makes the data model inconsistent with a proper double-entry ledger where entries reference users, not group-scoped members.

---

## Requirements

### 1. New Event Type: `USER_CREATED`

```js
export const USER_CREATED = 'USER_CREATED'
```

Event data shape:

```js
{
  id: string,        // UUID — global user identifier
  name: string,      // display name (unique globally? — see below)
  createdAt: string  // ISO timestamp
}
```

### 2. User Name Uniqueness

**Question to resolve during implementation:** Should user names be globally unique?

- **Option A: Globally unique** — no two users can share the same name. This prevents ambiguity in the UI but may be restrictive.
- **Option B: Not globally unique** — display names can collide. Use UUIDs for internal references; show names in UI with some disambiguation (e.g., append partial UUID).

**Recommendation:** Start with **Option B** (no global uniqueness constraint). Keep it simple — names are display-only. The user ID (UUID) is the true identifier.

### 3. Modify `MEMBER_ADDED` Event

Change the `MEMBER_ADDED` event data to reference a global user:

**Old:**
```js
{ groupId: string, id: string, name: string }
```

**New:**
```js
{ groupId: string, userId: string, addedAt: string }
```

The `userId` references a `USER_CREATED` event's `id`. The user's name is looked up from the user registry, not duplicated in the membership.

### 4. State Projection Changes

In `projectState()`:

- Add a `users` section to state:
  ```js
  state.users = { [userId]: { id, name, createdAt } }
  ```
- Change `state.members` from `{ [groupId]: [{ id, name }] }` to:
  ```js
  state.members = { [groupId]: [userId] }  // just an array of user IDs
  ```
- Add a convenience field:
  ```js
  state.groupMembers = { [groupId]: [{ userId, userName, addedAt }] }  // enriched
  ```

### 5. API Handler Changes

#### `src/api/members.js`

- **`form(params, _request)`** — The "Add Member" form now needs to distinguish between:
  - **New user**: Create a `USER_CREATED` event + `MEMBER_ADDED` event
  - **Existing user**: Just create a `MEMBER_ADDED` event linking the existing user to the group
  
  Design decision: **Start simple — always create a new user**. The form takes a name, creates a `USER_CREATED` event (if name doesn't exist yet), then creates a `MEMBER_ADDED` event. An "add existing user" feature can be added later.

- **`add(params, request)`**:
  1. Read `name` from form data
  2. Check if user already exists (search `state.users` by name — case-insensitive)
  3. If not found: create `USER_CREATED` event
  4. Create `MEMBER_ADDED` event linking user to group
  5. Return updated group detail

#### `src/api/groups.js`

- **`detail(params, _request)`** — Look up member names from `state.users` instead of from member data.

#### `src/api/expenses.js`

- The `paidBy` field and split target IDs now reference global user IDs (UUIDs from `USER_CREATED`). No structural change needed — they're already UUIDs.

#### `src/api/balances.js`

- No changes needed — balances are per-user-ID, which are now global.

### 6. View Changes

Update all view functions to look up user names from the global `state.users` registry instead of from per-group member data.

- `src/views/group-detail.html.hx.js` — Pass `users` lookup when rendering member names
- `src/views/expense-form.html.hx.js` — Members list comes from `state.groupMembers`
- `src/views/settlements.html.hx.js` — User name lookup from global users
- `src/views/groups-list.html.hx.js` — No change (groups list doesn't show members)

### 7. No Data Migration

Since there are no real users, existing IndexedDB data is expected to be incompatible. Fresh start is acceptable.

---

## Files to modify

| File | Changes |
|------|---------|
| `src/db/events.js` | Add `USER_CREATED` constant; update `projectState()` to build user registry; change members projection |
| `src/api/members.js` | Create users if needed; reference global user IDs; check for existing users by name |
| `src/api/groups.js` | Look up member names from users registry |
| `src/api/expenses.js` | Ensure `paidBy` references global user ID (already does, just confirm) |
| `src/views/group-detail.html.hx.js` | Use global user name lookup |
| `src/views/expense-form.html.hx.js` | Use global user name lookup |
| `src/views/settlements.html.hx.js` | Use global user name lookup |
| `sw.js` | Ensure new events file exports are cached |

---

## Acceptance Criteria

- [ ] `USER_CREATED` event type exists and creates global users
- [ ] `MEMBER_ADDED` event references a global `userId` (not an inline name)
- [ ] `projectState()` builds a `state.users` registry
- [ ] Members are displayed using their global user name
- [ ] Adding a member with an existing name reuses the existing user OR creates a new one (decision: create new, no global uniqueness)
- [ ] All views correctly display user names from global registry
- [ ] Adding the same user name to two different groups works (same user ID or different?)

**Decision needed during implementation:** Should adding "Alice" to Group A and then "Alice" to Group B create one global "Alice" user or two? Keep it simple: **always create a new user** (no global name uniqueness). This avoids accidental merges.

---

## E2E Tests

Add the following test scenarios to `tests/e2e/scenarios.spec.js` (or `tests/e2e/global-users.spec.js`):

### Test: Create member creates global user
1. Create a group
2. Add a member "Alice"
3. Verify: member is displayed with name "Alice" in the group

### Test: Same name in two groups creates separate users
1. Create group "A" and add "Alice"
2. Create group "B" and add "Alice" (same name)
3. Verify: both groups show "Alice" correctly
4. Verify: adding an expense in group A only affects group A's balances (users are distinct)

### Test: Member displayed with global user name
1. Create a group
2. Add member "Alice"
3. Add expense paid by Alice
4. Verify: expense shows "Alice" as the payer (looked up from global registry)

### Test: Member name appears in balances
1. Create a group with Alice and Bob
2. Add expense: €20 paid by Alice, split equal
3. Verify: balance shows "Alice is owed €10.00" and "Bob owes €10.00" (names correct)

### Test: Member form still works (regression)
1. Create a group
2. Click "Add Member"
3. Verify: form appears with name input
4. Fill name, submit
5. Verify: member appears in member list

---

## Dependencies

- Depends on task 23 (double-entry ledger) being done — ledger entries reference global user IDs
