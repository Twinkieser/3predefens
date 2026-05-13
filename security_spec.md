# EcoSort AI Security Specification

## Data Invariants
1. A user profile must have a valid non-negative points value.
2. A scan MUST belong to the authenticated user (uid match).
3. Points can only be incremented, never decremented by the user.
4. Classification results (category) must be from the predefined list.

## The Dirty Dozen Payloads (Attempted Violations)
1. **Identity Spoofing**: Attempt to create a profile for another UID.
2. **Ghost Points**: Increment points by 10,000 in a single update.
3. **Shadow Fields**: Add `isAdmin: true` to user profile.
4. **ID Poisoning**: Use a 2KB string as a scan ID.
5. **PII Breach**: Read another user's private scan history.
6. **Immutability Bypass**: Update the `category` of a past scan.
7. **Type Confusion**: Send `points: "many"` as a string.
8. **Boundary Violation**: Confidence score of `1.5`.
9. **Relational Orphan**: Create a scan for a user that doesn't exist.
10. **Malicious ID**: Use `../..` or similar in document ID.
11. **Outcome Manipulation**: Set level to "Eco Warrior" with 0 points.
12. **Blanket Read**: Query `/users` without a specific UID filter.

## Security Rule Logic
- `isValidUser(data)`: Enforces `uid`, `email`, `points`, `level`.
- `isValidScan(data)`: Enforces `category`, `confidence`, `pointsEarned`.
- `isOwner(userId)`: `request.auth.uid == userId`.
