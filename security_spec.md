# Security Specification

## 1. Data Invariants
- Each user profile `/users/{userId}` can ONLY be read and written by the authenticated user whose `request.auth.uid == userId`.
- User subcollections `/users/{userId}/interviews/{interviewId}`, `/users/{userId}/pausedSession/{sessionId}`, and `/users/{userId}/testResults/{testId}` are strictly accessible ONLY to the authenticated owner (`request.auth.uid == userId`).
- No user can ever list or read another user's interview history or paused sessions.
- Default deny applies to all collections.

## 2. Dirty Dozen Threat Vectors Blocked
1. Unauthenticated read of any user document
2. Unauthenticated write of any user document
3. User A attempting to read User B's profile `/users/{userB}`
4. User A attempting to write to User B's profile `/users/{userB}`
5. User A attempting to list User B's interviews `/users/{userB}/interviews`
6. User A attempting to insert an interview record into User B's `/users/{userB}/interviews`
7. User A attempting to read User B's paused interview `/users/{userB}/pausedSession/current`
8. Malicious client attempting to write junk oversized payloads (>128 chars in userId or invalid ID pattern)
9. Modifying someone else's test results
10. Attempting to bypass path rules by listing root `/users`
11. Injecting arbitrary unexpected root collections
12. Attempting to delete another user's interview records
