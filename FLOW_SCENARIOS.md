# React Blob Uploader - Flow Scenarios Guide

## Overview

`react-blob-uploader` is a highly configurable component that supports multiple upload workflows through two key props: `instantUpload` and `instantSyncAttach`.

---

## Configuration Props

### `instantUpload` (boolean)
Controls **when** the upload to S3 starts:
- `true`: Upload starts immediately when file is selected
- `false`: File stays at `SELECTED_FOR_UPLOAD` until manually triggered

### `instantSyncAttach` (boolean)
Controls **when** the attachment record is created:
- `true`: Create attachment immediately after blob record
- `false`: Stop at `BLOB_CREATED`, attach later

### `attachableId` (number | null)
The entity ID to attach blobs to (e.g., Offer ID, Product ID):
- `null`: No attachment will be created (even if `instantSyncAttach=true`)
- `number`: Attachment can be created when `instantSyncAttach=true`

---

## The 4 Main Scenarios

### Scenario 1: Immediate Upload + Immediate Attach
**Configuration**:
```typescript
instantUpload={true}
instantSyncAttach={true}
attachableId={offerId}
```

**Use Case**: Real-time file management (e.g., profile picture, document upload)

**Flow**:
```
User selects file
  ↓
SELECTED_FOR_UPLOAD (checksum calculated)
  ↓ (auto-triggered by instantUpload=true)
UPLOADING_URL_GENERATING (getting presigned URL)
  ↓
UPLOADING_URL_GENERATED (presigned URL received)
  ↓ (auto-triggered)
UPLOADING (uploading to S3)
  ↓
UPLOADED (S3 upload complete)
  ↓ (auto-triggered)
BLOB_CREATING (creating blob record in DB)
  ↓
BLOB_CREATED (blob record created)
  ↓ (auto-triggered by instantSyncAttach=true + attachableId)
ATTACHING (creating attachment record)
  ↓
ATTACHED ✅ (FINAL STATE - fully synchronized)
```

**Characteristics**:
- ✅ Fully automatic - no user intervention needed
- ✅ Real-time sync - changes reflected in DB immediately
- ✅ Final state: `ATTACHED`
- ⚠️ Requires `attachableId` to be available immediately

---

### Scenario 2: Immediate Upload + Manual Attach
**Configuration**:
```typescript
instantUpload={true}
instantSyncAttach={false}
attachableId={null}  // or any number, doesn't matter
```

**Use Case**: Form-based uploads where entity doesn't exist yet (Create forms)

**Flow**:
```
User selects file
  ↓
SELECTED_FOR_UPLOAD
  ↓ (auto-triggered by instantUpload=true)
UPLOADING_URL_GENERATING
  ↓
UPLOADING_URL_GENERATED
  ↓
UPLOADING
  ↓
UPLOADED
  ↓
BLOB_CREATING
  ↓
BLOB_CREATED ✅ (FINAL STATE - uploaded but not attached)
  ↓ (stops here, attachment created when form saves)
```

**Later, when form is saved**:
```typescript
// In form submission
await createAttachment({
  blobId: blob.blobId,
  attachableId: newOfferId,  // Now we have the ID
  attachableType: 'Offer'
});
```

**Characteristics**:
- ✅ Upload happens immediately - user sees progress
- ✅ Blob ready in S3 before form submission
- ✅ Final state: `BLOB_CREATED` (until form saves)
- ✅ No `attachableId` required initially
- 📋 Parent responsible for creating attachments on save

**Benefits**:
- User gets immediate feedback
- Faster form submission (uploads already done)
- Can validate uploads before creating entity
- Can cancel form without creating attachments

---

### Scenario 3: Manual Upload + Manual Attach
**Configuration**:
```typescript
instantUpload={false}
instantSyncAttach={false}
attachableId={null}  // or any number
```

**Use Case**: Batch processing, explicit user control

**Flow**:
```
User selects file
  ↓
SELECTED_FOR_UPLOAD ✅ (FINAL STATE - waiting for trigger)
  ↓ (stays here until parent toggles instantUpload=true)
```

**When parent triggers upload** (by changing `instantUpload` to `true`):
```
SELECTED_FOR_UPLOAD
  ↓ (now triggered by instantUpload change)
UPLOADING_URL_GENERATING
  ↓
UPLOADING_URL_GENERATED
  ↓
UPLOADING
  ↓
UPLOADED
  ↓
BLOB_CREATING
  ↓
BLOB_CREATED ✅ (NEW FINAL STATE)
```

**Characteristics**:
- ✅ Full control - uploads only when parent decides
- ✅ Can batch multiple file selections before uploading
- ✅ Final state: `SELECTED_FOR_UPLOAD` (before trigger)
- ✅ Final state: `BLOB_CREATED` (after trigger)
- 📋 Parent must change `instantUpload` prop to trigger

**Use Cases**:
- Multi-step forms where uploads happen at specific step
- Batch operations with "Upload All" button
- Preview-then-upload workflows

---

### Scenario 4: Manual Upload + Immediate Attach
**Configuration**:
```typescript
instantUpload={false}
instantSyncAttach={true}
attachableId={offerId}
```

**Use Case**: Rare - staged upload with immediate attachment

**Flow**:
```
User selects file
  ↓
SELECTED_FOR_UPLOAD ✅ (FINAL STATE - waiting)
  ↓ (stays here until parent toggles instantUpload=true)

When triggered:
SELECTED_FOR_UPLOAD
  ↓
UPLOADING_URL_GENERATING
  ↓
... (full upload flow)
  ↓
BLOB_CREATED
  ↓ (auto-triggered by instantSyncAttach=true)
ATTACHING
  ↓
ATTACHED ✅ (FINAL STATE)
```

**Characteristics**:
- ✅ Deferred upload start
- ✅ Automatic attachment when upload completes
- ⚠️ Less common use case

---

## State Transition Rules

### Automatic Transitions

Transitions happen automatically when conditions are met:

| Current State | Condition | Next State |
|--------------|-----------|------------|
| `SELECTED_FOR_UPLOAD` | `instantUpload=true` + has file data | `UPLOADING_URL_GENERATING` |
| `UPLOADING_URL_GENERATING` | `getUploadUrl` success | `UPLOADING_URL_GENERATED` |
| `UPLOADING_URL_GENERATED` | has file + uploadUrl | `UPLOADING` |
| `UPLOADING` | `directUpload` success | `UPLOADED` |
| `UPLOADED` | has key + metadata | `BLOB_CREATING` |
| `BLOB_CREATING` | `createBlob` success | `BLOB_CREATED` |
| `BLOB_CREATED` | `instantSyncAttach=true` + has attachableId | `ATTACHING` |
| `ATTACHING` | `createAttachment` success | `ATTACHED` |

### Manual Transitions

User actions that trigger transitions:

| Action | Current State | New State |
|--------|---------------|-----------|
| Remove blob | `ATTACHED` + `instantSyncAttach=false` | `DETACHED` |
| Remove blob | `ATTACHED` + `instantSyncAttach=true` | `MARKED_FOR_DETACH` |
| Remove blob | Any other state | Unlink (remove from list) |
| Retry | Any state with error | Clear error, retry from current state |

---

## Final State Detection

The `isBlobTransitioning()` helper determines if a blob is in a final state based on configuration:

### With `instantUpload=false`:
**Final states**: `SELECTED_FOR_UPLOAD`, `ATTACHED`, `DETACHED`

### With `instantUpload=true, instantSyncAttach=false`:
**Final states**: `BLOB_CREATED`, `ATTACHED`, `DETACHED`

### With `instantUpload=true, instantSyncAttach=true`:
**Final states**: `ATTACHED`, `DETACHED`

### Usage:
```typescript
import { hasTransitioningBlobs } from 'react-blob-uploader';

// Check if any blobs are still processing
const isProcessing = hasTransitioningBlobs(
  blobs,
  instantUpload,
  instantSyncAttach
);

// Disable save button during processing
<button disabled={isProcessing}>Save</button>
```

---

## Error Handling & Retry

### Retry Mechanism

Each blob has a `retryCount` (default: 3):

**On Error**:
1. State remains at current step
2. `errorMessage` is set
3. `retryCount` is decremented
4. Retry button appears (if `retryCount > 0`)

**On Retry Click**:
1. `errorMessage` is cleared
2. `retryCount` is decremented
3. State machine re-evaluates from current state

**Example**:
```
UPLOADING_URL_GENERATING (retryCount: 3)
  ↓ (getUploadUrl fails)
UPLOADING_URL_GENERATING (retryCount: 2, errorMessage: "Network error")
  ← User clicks Retry
UPLOADING_URL_GENERATING (retryCount: 1, errorMessage: null)
  ↓ (retries getUploadUrl)
```

**No Automatic Retry**: User must click the retry button - this gives them control and prevents excessive API calls.

---

## Remove/Delete Flows

### Scenario A: Remove Unattached Blob
**Condition**: Blob state is anything except `ATTACHED`

**Flow**:
```
Any state (except ATTACHED)
  ↓ (user clicks Remove)
Unlink immediately
  - Remove from filesMap
  - Remove from blobs array
  - Reset main blob if it was main
```

### Scenario B: Remove Attached Blob (No Sync)
**Condition**: `state=ATTACHED` + `instantSyncAttach=false`

**Flow**:
```
ATTACHED
  ↓ (user clicks Remove)
DETACHED
  ↓ (state machine triggers)
Unlink
```

**Why**: Attachment still exists in DB, parent will handle cleanup on save

### Scenario C: Remove Attached Blob (With Sync)
**Condition**: `state=ATTACHED` + `instantSyncAttach=true`

**Flow**:
```
ATTACHED
  ↓ (user clicks Remove)
MARKED_FOR_DETACH
  ↓ (state machine triggers deleteAttachment)
DETACHING
  ↓ (deleteAttachment success)
DETACHED
  ↓
Unlink
```

**Why**: Immediately remove attachment from DB

---

## Integration Patterns

### Pattern 1: Create Form (Recommended)
```typescript
const CreateForm = () => {
  const [blobs, setBlobs] = useState<BlobType[]>([]);
  
  return (
    <BlobUploader
      instantUpload={true}          // Upload immediately
      instantSyncAttach={false}     // Don't attach yet
      attachableId={null}           // No entity yet
      blobs={blobs}
      setBlobs={setBlobs}
      mutations={mutations}
    />
  );
};

// On form submit
const handleSubmit = async () => {
  // 1. Create entity
  const offer = await createOffer({...});
  
  // 2. Create attachments for all blobs
  for (const blob of blobs.filter(b => b.state === 'BLOB_CREATED')) {
    await createAttachment({
      blobId: blob.blobId,
      attachableId: offer.id,
      attachableType: 'Offer'
    });
  }
};
```

### Pattern 2: Edit Form
```typescript
const EditForm = ({ offerId, existingImages }) => {
  const [blobs, setBlobs] = useState<BlobType[]>([]);
  
  // Load existing images as BLOB_CREATED
  useEffect(() => {
    const initialBlobs = existingImages.map(img => ({
      ...img,
      state: 'BLOB_CREATED' as const,
      retryCount: 3,
    }));
    setBlobs(initialBlobs);
  }, [existingImages]);
  
  return (
    <BlobUploader
      instantUpload={true}          // New images upload immediately
      instantSyncAttach={false}     // Don't attach yet
      attachableId={null}           // Attach on save, not immediately
      blobs={blobs}
      setBlobs={setBlobs}
      mutations={mutations}
    />
  );
};

// On form save
const handleSave = async () => {
  // Wait for all uploads to complete
  if (hasTransitioningBlobs(blobs, true, false)) {
    toast.error('Please wait for uploads to complete');
    return;
  }
  
  // Create attachments for new blobs
  const newBlobs = blobs.filter(b => 
    b.state === 'BLOB_CREATED' && !b.attachmentId
  );
  
  for (const blob of newBlobs) {
    await createAttachment({
      blobId: blob.blobId,
      attachableId: offerId,
      attachableType: 'Offer'
    });
  }
};
```

### Pattern 3: Real-Time Sync
```typescript
const ProfilePicture = ({ userId }) => {
  const [blobs, setBlobs] = useState<BlobType[]>([]);
  
  return (
    <BlobUploader
      instantUpload={true}          // Upload immediately
      instantSyncAttach={true}      // Attach immediately
      attachableId={userId}         // Entity already exists
      maxBlobs={1}                  // Only one profile picture
      blobs={blobs}
      setBlobs={setBlobs}
      mutations={mutations}
    />
  );
};
// Everything happens automatically - no save button needed!
```

### Pattern 4: Batch Upload with Trigger
```typescript
const BatchUploader = () => {
  const [blobs, setBlobs] = useState<BlobType[]>([]);
  const [instantUpload, setInstantUpload] = useState(false);
  
  const handleUploadAll = () => {
    setInstantUpload(true);  // Trigger uploads
  };
  
  return (
    <>
      <BlobUploader
        instantUpload={instantUpload}
        instantSyncAttach={false}
        attachableId={null}
        blobs={blobs}
        setBlobs={setBlobs}
        mutations={mutations}
      />
      <button onClick={handleUploadAll}>
        Upload All ({blobs.length})
      </button>
    </>
  );
};
```

---

## ProcessRunning Integration

The `processRunning` prop disables all user interactions:

```typescript
<BlobUploader
  // ...other props
  processRunning={isSaving}  // Form is being submitted
/>
```

**When `processRunning=true`**:
- ✅ Upload button hidden
- ✅ Remove buttons disabled
- ✅ Set Main buttons disabled
- ✅ Retry buttons disabled
- ✅ Visual feedback (opacity-50, cursor-not-allowed)
- ✅ Tooltips show "Form is processing"

**Use Cases**:
- Prevent modifications during form submission
- Prevent uploads during server operations
- Lock UI during critical operations

---

## Summary Table

| Scenario | instantUpload | instantSyncAttach | attachableId | Final State | Use Case |
|----------|---------------|-------------------|--------------|-------------|----------|
| 1 | `true` | `true` | Required | `ATTACHED` | Real-time sync |
| 2 | `true` | `false` | Optional | `BLOB_CREATED` | Create forms |
| 3 | `false` | `false` | Optional | `SELECTED_FOR_UPLOAD` → `BLOB_CREATED` | Batch/manual |
| 4 | `false` | `true` | Required | `SELECTED_FOR_UPLOAD` → `ATTACHED` | Staged sync |

---

## Best Practices

### ✅ DO:
1. Use Scenario 2 for create forms (immediate upload, manual attach)
2. Use Scenario 1 for simple file managers (immediate everything)
3. Use `processRunning` to prevent interactions during save
4. Check `hasTransitioningBlobs()` before form submission
5. Handle errors gracefully with retry mechanism

### ❌ DON'T:
1. Don't use Scenario 3 unless you need explicit control
2. Don't set `instantSyncAttach=true` without `attachableId`
3. Don't modify blobs array while uploads are in progress
4. Don't forget to create attachments in create forms
5. Don't retry automatically - let user control retries

---

## Debugging Tips

### Check Current State:
```typescript
console.log('Blobs:', blobs.map(b => ({
  name: b.name,
  state: b.state,
  error: b.errorMessage,
  retryCount: b.retryCount
})));
```

### Check if Transitioning:
```typescript
import { isBlobTransitioning } from 'react-blob-uploader';

blobs.forEach(blob => {
  const isTransitioning = isBlobTransitioning(
    blob,
    true,  // your instantUpload value
    false  // your instantSyncAttach value
  );
  console.log(`${blob.name}: transitioning=${isTransitioning}`);
});
```

### Monitor State Changes:
```typescript
useEffect(() => {
  console.log('Blobs changed:', blobs);
}, [blobs]);
```

---

## Conclusion

`react-blob-uploader` supports flexible workflows through simple configuration:
- **2 boolean props** control the entire flow
- **4 main scenarios** cover most use cases
- **Automatic state machine** handles transitions
- **Manual retry** gives users control
- **Process running** prevents unwanted interactions

Choose the scenario that matches your UX requirements and the component handles the rest!

