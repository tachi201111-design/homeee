# Security Specification - HomeDesign 3D

## 1. Data Invariants
- **User Integrity**: A user profile (`/users/{userId}`) can only be created or modified by the user with the matching UID.
- **Ownership**: A project (`/projects/{projectId}`) must have an `ownerId` field that matches the `request.auth.uid` of the creator.
- **Relational Integrity**: Projects cannot be updated to belong to a different owner.
- **Immutability**: `createdAt` fields are immutable after creation.
- **Type Safety**: All fields must match their defined types in `firebase-blueprint.json`.
- **State Control**: Project `status` must be one of the allowed enum values.

## 2. The "Dirty Dozen" Payloads

### DD-01: Identity Spoofing (Create User)
**Attempt**: Create a user profile for a different UID.
**Payload**: `setDoc(doc(db, 'users', 'victim_uid'), { uid: 'victim_uid', email: 'attacker@evil.com' })`
**Expected**: PERMISSION_DENIED

### DD-02: Identity Spoofing (Create Project)
**Attempt**: Create a project with someone else's ownerId.
**Payload**: `addDoc(collection(db, 'projects'), { title: 'Stolen Project', ownerId: 'victim_uid', status: 'Live' })`
**Expected**: PERMISSION_DENIED

### DD-03: Resource Poisoning (Massive ID)
**Attempt**: Create a project with a 2KB string as ID.
**Payload**: `setDoc(doc(db, 'projects', 'A'.repeat(2048)), { ...validProject })`
**Expected**: PERMISSION_DENIED

### DD-04: Shadow Update (Ghost Field)
**Attempt**: Add a hidden `isAdmin` field to a user profile.
**Payload**: `updateDoc(doc(db, 'users', 'my_uid'), { isAdmin: true })`
**Expected**: PERMISSION_DENIED

### DD-05: State Shortcutting (Illegal Enum)
**Attempt**: Set an invalid status.
**Payload**: `updateDoc(doc(db, 'projects', 'my_project'), { status: 'GodMode' })`
**Expected**: PERMISSION_DENIED

### DD-06: Ownership Theft (Update ownerId)
**Attempt**: Change a project's ownerId to yourself.
**Payload**: `updateDoc(doc(db, 'projects', 'victim_project'), { ownerId: 'my_uid' })`
**Expected**: PERMISSION_DENIED

### DD-07: PII Leak (Blanket Read)
**Attempt**: List all users as a regular user.
**Payload**: `getDocs(collection(db, 'users'))`
**Expected**: PERMISSION_DENIED

### DD-08: Orphaned Record (Fake ownerId)
**Attempt**: Create project with non-existent ownerId (if validation exists).
**Payload**: `addDoc(collection(db, 'projects'), { ownerId: 'non_existent_uid', ... })`
**Expected**: PERMISSION_DENIED

### DD-09: Timestamp Spoofing (Old createdAt)
**Attempt**: Set `createdAt` to a date in the past.
**Payload**: `addDoc(collection(db, 'projects'), { createdAt: Timestamp.fromDate(new Date('1990-01-01')), ... })`
**Expected**: PERMISSION_DENIED

### DD-10: Type Confusion (String as Object)
**Attempt**: Set `data` field to a string instead of object.
**Payload**: `updateDoc(doc(db, 'projects', 'id'), { data: 'not_an_object' })`
**Expected**: PERMISSION_DENIED

### DD-11: Cross-User List Scrape
**Attempt**: Query all projects without filtering by ownerId.
**Payload**: `getDocs(collection(db, 'projects'))`
**Expected**: PERMISSION_DENIED

### DD-12: Delete Bypass
**Attempt**: Delete someone else's project.
**Payload**: `deleteDoc(doc(db, 'projects', 'victim_project'))`
**Expected**: PERMISSION_DENIED

## 3. Test Runner (Mock Logic)
The tests will be executed via ESLint and manual logic verification in Phase 5.
