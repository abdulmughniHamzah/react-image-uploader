# React Blob Uploader - Scenario Flows Guide

## Quick Overview

`react-blob-uploader` supports **4 main scenarios** controlled by 2 props:

| Prop | Purpose | Values |
|------|---------|--------|
| `instantUpload` | When to start upload | `true` = immediate, `false` = manual trigger |
| `instantSyncAttach` | When to create attachment | `true` = immediate, `false` = manual (on form save) |

---

## Scenario 1: Immediate Upload, Manual Attach ⭐ **RECOMMENDED**

### Configuration
```typescript
<BlobUploader
  instantUpload={true}
  instantSyncAttach={false}
  attachableId={null}  // No entity ID yet
  blobs={blobs}
  setBlobs={setBlobs}
  mutations={mutations}
/>
```

### Use Cases
- ✅ **Create forms** (entity doesn't exist yet)
- ✅ **Edit forms** (don't attach until save)
- ✅ **Multi-step wizards** (upload early, attach at final step)

### Flow Diagram
```
User selects file
    ↓
┌─────────────────────────┐
│ SELECTED_FOR_UPLOAD     │ Checksum calculated, preview shown
└─────────────────────────┘
    ↓ (instantUpload=true auto-triggers)
┌─────────────────────────┐
│ UPLOADING_URL_GENERATING│ Calling getUploadUrl mutation
└─────────────────────────┘
    ↓ (success)
┌─────────────────────────┐
│ UPLOADING_URL_GENERATED │ Presigned URL received
└─────────────────────────┘
    ↓ (auto-triggers with file)
┌─────────────────────────┐
│ UPLOADING               │ Direct upload to S3
└─────────────────────────┘
    ↓ (success)
┌─────────────────────────┐
│ UPLOADED                │ S3 upload complete
└─────────────────────────┘
    ↓ (auto-triggers)
┌─────────────────────────┐
│ BLOB_CREATING           │ Creating blob record in DB
└─────────────────────────┘
    ↓ (success)
┌─────────────────────────┐
│ BLOB_CREATED ✅         │ FINAL STATE - ready to attach
└─────────────────────────┘
    ↓ (stops here, instantSyncAttach=false)
    
Later, on form save:
    ↓ (parent calls createAttachment)
┌─────────────────────────┐
│ ATTACHED ✅             │ NEW FINAL STATE - fully synced
└─────────────────────────┘
```

### Benefits
- ✅ User sees immediate upload progress
- ✅ Faster form submission (uploads already done)
- ✅ Can validate uploads before creating entity
- ✅ Can cancel form without creating DB records
- ✅ No `attachableId` required upfront

### Parent Responsibility
```typescript
// On form submit
const handleSubmit = async () => {
  // 1. Check all uploads complete
  if (hasTransitioningBlobs(blobs, true, false)) {
    toast.error('Please wait for uploads to complete');
    return;
  }
  
  // 2. Create entity
  const offer = await createOffer({ title, price, description });
  
  // 3. Create attachments for all uploaded blobs
  for (const blob of blobs.filter(b => b.state === 'BLOB_CREATED')) {
    await createAttachment({
      blobId: blob.blobId,
      attachableId: offer.id,
      attachableType: 'Offer'
    });
  }
};
```

---

## Scenario 2: Immediate Upload, Immediate Attach

### Configuration
```typescript
<BlobUploader
  instantUpload={true}
  instantSyncAttach={true}
  attachableId={offerId}  // REQUIRED - entity must exist
  blobs={blobs}
  setBlobs={setBlobs}
  mutations={mutations}
/>
```

### Use Cases
- ✅ **Profile pictures** (single file, immediate sync)
- ✅ **Document uploads** (to existing entity)
- ✅ **Real-time file managers**

### Flow Diagram
```
User selects file
    ↓
SELECTED_FOR_UPLOAD
    ↓ (instantUpload=true)
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
┌─────────────────────────┐
│ BLOB_CREATED            │
└─────────────────────────┘
    ↓ (instantSyncAttach=true + attachableId present)
┌─────────────────────────┐
│ ATTACHING               │ Creating attachment record
└─────────────────────────┘
    ↓ (success)
┌─────────────────────────┐
│ ATTACHED ✅             │ FINAL STATE - fully synced
└─────────────────────────┘
```

### Benefits
- ✅ Fully automatic - no form submission needed
- ✅ Real-time sync to database
- ✅ Immediate feedback to user
- ✅ No parent logic required

### Requirements
- ⚠️ Entity must exist before upload starts
- ⚠️ `attachableId` must be provided
- ⚠️ No way to cancel attachment (happens automatically)

---

## Scenario 3: Manual Upload, Manual Attach

### Configuration
```typescript
<BlobUploader
  instantUpload={false}  // Wait for trigger
  instantSyncAttach={false}
  attachableId={null}
  blobs={blobs}
  setBlobs={setBlobs}
  mutations={mutations}
/>
```

### Use Cases
- ✅ **Batch processing** (select many, upload all at once)
- ✅ **Preview-then-upload** workflows
- ✅ **Multi-file review** before uploading

### Flow Diagram
```
User selects files
    ↓
┌─────────────────────────┐
│ SELECTED_FOR_UPLOAD ✅  │ FINAL STATE - waiting for trigger
└─────────────────────────┘
    ↓ (user can select more files, review, etc.)
    ↓ (parent changes instantUpload prop to true)
┌─────────────────────────┐
│ UPLOADING_URL_GENERATING│
└─────────────────────────┘
    ↓
UPLOADING_URL_GENERATED
    ↓
UPLOADING
    ↓
UPLOADED
    ↓
BLOB_CREATING
    ↓
┌─────────────────────────┐
│ BLOB_CREATED ✅         │ NEW FINAL STATE
└─────────────────────────┘
```

### Parent Control
```typescript
const [instantUpload, setInstantUpload] = useState(false);

// User clicks "Upload All"
const handleUploadAll = () => {
  setInstantUpload(true);  // Triggers all pending uploads
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
      Upload All ({blobs.filter(b => b.state === 'SELECTED_FOR_UPLOAD').length})
    </button>
  </>
);
```

### Benefits
- ✅ Full control over when uploads start
- ✅ Can batch-select multiple files
- ✅ Can review files before uploading
- ✅ Can remove files before upload starts

---

## Scenario 4: Manual Upload, Immediate Attach

### Configuration
```typescript
<BlobUploader
  instantUpload={false}
  instantSyncAttach={true}
  attachableId={offerId}  // REQUIRED
  blobs={blobs}
  setBlobs={setBlobs}
  mutations={mutations}
/>
```

### Use Cases
- ⚠️ **Rare** - staged upload with automatic attachment
- ⚠️ Specific workflows requiring delayed upload but immediate attach

### Flow Diagram
```
User selects file
    ↓
┌─────────────────────────┐
│ SELECTED_FOR_UPLOAD ✅  │ FINAL STATE - waiting
└─────────────────────────┘
    ↓ (parent triggers by changing instantUpload to true)
UPLOADING_URL_GENERATING
    ↓
...full upload flow...
    ↓
BLOB_CREATED
    ↓ (instantSyncAttach=true + attachableId)
ATTACHING
    ↓
┌─────────────────────────┐
│ ATTACHED ✅             │ NEW FINAL STATE
└─────────────────────────┘
```

---

## Error Handling & Retry Flow 🔄

### **New Manual Retry Behavior**

When an error occurs, the blob:
1. ⬅️ **Steps back one state** (to previous state)
2. ❌ **Sets error message** (shown to user)
3. 🔢 **Decrements retry count** (clamped at 0)
4. ⏸️ **Stops progression** (waits for manual retry)

### Error Recovery Flow

```
Example: Error during BLOB_CREATING

┌─────────────────────────┐
│ UPLOADED                │ Previous successful state
└─────────────────────────┘
    ↓
┌─────────────────────────┐
│ BLOB_CREATING           │ Attempting to create blob
└─────────────────────────┘
    ↓ (network error)
    ↓
┌─────────────────────────┐
│ UPLOADED                │ ⬅️ STEPPED BACK
│ errorMessage: "Failed" │ ❌ Error set
│ retryCount: 2           │ 🔢 Decremented (was 3)
└─────────────────────────┘
    ↓ (user clicks Retry button)
    ↓ (errorMessage cleared, retryCount decremented)
┌─────────────────────────┐
│ UPLOADED                │
│ errorMessage: null      │ ✅ Cleared
│ retryCount: 1           │ 🔢 Now 1
└─────────────────────────┘
    ↓ (state machine re-evaluates)
┌─────────────────────────┐
│ BLOB_CREATING           │ ↻ Retry attempt
└─────────────────────────┘
    ↓ (success)
┌─────────────────────────┐
│ BLOB_CREATED ✅         │
│ errorMessage: null      │
│ retryCount: 1           │
└─────────────────────────┘
```

### Error at Each State

| Current State | Error Occurs | Steps Back To | User Action |
|--------------|--------------|---------------|-------------|
| `UPLOADING_URL_GENERATING` | getUploadUrl fails | `SELECTED_FOR_UPLOAD` | Click Retry |
| `UPLOADING` | S3 upload fails | `UPLOADING_URL_GENERATED` | Click Retry |
| `BLOB_CREATING` | createBlob fails | `UPLOADED` | Click Retry |
| `ATTACHING` | createAttachment fails | `BLOB_CREATED` | Click Retry |
| `DETACHING` | deleteAttachment fails | `MARKED_FOR_DETACH` | Click Retry |

### Retry Button Logic

```typescript
// Retry button shown when:
const showRetry = blob.errorMessage && blob.retryCount > 0;

// When clicked:
const handleRetry = () => {
  setBlob(hash, {
    errorMessage: null,          // Clear error
    retryCount: blob.retryCount - 1  // Decrement count
  });
  // State machine re-evaluates and retries from current state
};
```

### No Retry Available

```
After 3 failed attempts:

┌─────────────────────────┐
│ UPLOADED                │
│ errorMessage: "Failed"  │ ❌ Error persists
│ retryCount: 0           │ 🔢 No retries left
└─────────────────────────┘
    ↓
No Retry button shown
User must remove blob or fix issue
```

### External Retry (Axios/TanStack)

```typescript
// In your mutation wrapper
const useGetUploadUrlMutation = () => {
  return useMutation({
    mutationFn: async ({ hash, name, mimeType, size }) => {
      const response = await axiosClient.post(
        endPoints.vendor.uploadBlobUrl,
        { checksum: hash, name, mimeType, size }
      );
      return response.data.data;
    },
    // ✅ TanStack Query handles automatic retries here
    retry: 2,  // Retry twice automatically
    retryDelay: 1000,  // 1 second between retries
  });
};
```

**How it works**:
1. TanStack/Axios retries automatically (network level)
2. If all automatic retries fail → mutation returns error
3. Blob uploader steps back one state
4. User sees error message with manual retry button
5. User clicks retry → tries again from current state
6. TanStack/Axios auto-retries again if needed

**Result**: Best of both worlds!
- Network-level automatic retries (transparent to user)
- UI-level manual retry (user control)

---

## Remove/Delete Flows 🗑️

### Case 1: Remove Unattached Blob

**Condition**: Any state except `ATTACHED`

```
Any state (not ATTACHED)
    ↓ (user clicks Remove)
    ↓
Immediately unlinked:
    • Removed from filesMap
    • Removed from blobs array
    • Reset main blob if it was main
```

**Code**:
```typescript
if (blob.state !== 'ATTACHED') {
  unlinkBlob();  // Immediate removal
}
```

---

### Case 2: Remove Attached Blob (Manual Sync)

**Condition**: `state = ATTACHED` + `instantSyncAttach = false`

```
┌─────────────────────────┐
│ ATTACHED                │
└─────────────────────────┘
    ↓ (user clicks Remove)
┌─────────────────────────┐
│ DETACHED                │ State changed to DETACHED
└─────────────────────────┘
    ↓ (state machine triggers)
Unlinked from UI
    
Note: Attachment still exists in DB
Parent handles cleanup on form save
```

**Why**: In create/edit forms, we don't immediately delete attachments. The parent will handle cleanup when the form is saved or cancelled.

**Parent responsibility**:
```typescript
// On form save
const removedBlobs = originalBlobs.filter(orig =>
  !currentBlobs.some(curr => curr.blobId === orig.blobId)
);

for (const blob of removedBlobs) {
  if (blob.attachmentId) {
    await deleteAttachment({ attachmentId: blob.attachmentId });
  }
}
```

---

### Case 3: Remove Attached Blob (Immediate Sync)

**Condition**: `state = ATTACHED` + `instantSyncAttach = true`

```
┌─────────────────────────┐
│ ATTACHED                │
└─────────────────────────┘
    ↓ (user clicks Remove)
┌─────────────────────────┐
│ MARKED_FOR_DETACH       │
└─────────────────────────┘
    ↓ (state machine triggers deleteAttachment)
┌─────────────────────────┐
│ DETACHING               │ Calling deleteAttachment mutation
└─────────────────────────┘
    ↓ (success)
┌─────────────────────────┐
│ DETACHED                │
└─────────────────────────┘
    ↓
Unlinked from UI + DB cleaned up
```

**Why**: In real-time sync scenarios, we immediately remove the attachment from the database.

---

## Final State Detection 🎯

### Helper Function

```typescript
import { isBlobTransitioning, hasTransitioningBlobs } from 'react-blob-uploader';

// Check single blob
const isTransitioning = isBlobTransitioning(
  blob,
  instantUpload,
  instantSyncAttach
);

// Check all blobs
const anyTransitioning = hasTransitioningBlobs(
  blobs,
  instantUpload,
  instantSyncAttach
);
```

### Final States by Configuration

#### `instantUpload=false`
**Final states**: 
- ✅ `SELECTED_FOR_UPLOAD` (waiting for trigger)
- ✅ `ATTACHED` (if later uploaded and attached)
- ✅ `DETACHED` (if removed)

#### `instantUpload=true, instantSyncAttach=false`
**Final states**:
- ✅ `BLOB_CREATED` (uploaded, not attached)
- ✅ `ATTACHED` (if later attached by parent)
- ✅ `DETACHED` (if removed)

#### `instantUpload=true, instantSyncAttach=true`
**Final states**:
- ✅ `ATTACHED` (fully synced)
- ✅ `DETACHED` (if removed)

### Usage in Forms

```typescript
// Disable save button while uploads in progress
const SaveButton = () => {
  const isUploading = hasTransitioningBlobs(
    blobs,
    true,  // instantUpload value
    false  // instantSyncAttach value
  );
  
  return (
    <button disabled={isUploading || isSaving}>
      {isUploading || isSaving ? 'Saving...' : 'Save Changes'}
    </button>
  );
};
```

---

## ProcessRunning Integration 🔒

### Purpose
Prevents user from modifying blobs during critical operations (e.g., form submission).

### Configuration
```typescript
<BlobUploader
  // ...other props
  processRunning={isSaving}  // Form is being saved
/>
```

### What Gets Disabled

When `processRunning={true}`:

| Element | Behavior |
|---------|----------|
| Upload button | ❌ Hidden |
| Remove button | ❌ Disabled + opacity-50 + tooltip "Form is processing" |
| Set Main button | ❌ Disabled + opacity-50 + tooltip "Form is processing" |
| Retry button | ❌ Disabled + opacity-50 + tooltip "Form is processing" |
| Drag-and-drop | ✅ Still works (reordering is harmless) |

### Example Usage

```typescript
const EditForm = () => {
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSave = async () => {
    setIsSaving(true);  // 🔒 Locks uploader
    try {
      await updateListing({...});
    } finally {
      setIsSaving(false);  // 🔓 Unlocks uploader
    }
  };
  
  return (
    <BlobUploader
      processRunning={isSaving}  // Pass the flag
      // ...other props
    />
  );
};
```

---

## Complete State Machine Diagram 📊

```
                    ┌──────────────────────┐
                    │ User selects file    │
                    └──────────┬───────────┘
                               ↓
                    ┌──────────────────────┐
                    │ SELECTED_FOR_UPLOAD  │
                    └──────────┬───────────┘
                               ↓
            ┌──────────────────┴──────────────────┐
            │ instantUpload?                      │
            ├─────────────────┬───────────────────┤
         false                │                true
            │                 │                   │
            ↓                 │                   ↓
    ⏸️ WAIT FOR TRIGGER      │    ┌──────────────────────────┐
    (Scenario 3/4)            │    │ UPLOADING_URL_GENERATING │
            │                 │    └──────────┬───────────────┘
            │                 │               ↓
            │                 │    ┌──────────────────────────┐
            │                 │    │  UPLOADING_URL_GENERATED │
            │                 │    └──────────┬───────────────┘
            │                 │               ↓
            │                 │    ┌──────────────────────────┐
            │                 │    │      UPLOADING           │
            │                 │    └──────────┬───────────────┘
            │                 │               ↓
            │                 │    ┌──────────────────────────┐
            │                 │    │       UPLOADED           │
            │                 │    └──────────┬───────────────┘
            │                 │               ↓
            │                 │    ┌──────────────────────────┐
            │                 │    │    BLOB_CREATING         │
            │                 │    └──────────┬───────────────┘
            │                 │               ↓
            └─────────────────┴────►┌──────────────────────────┐
                                    │     BLOB_CREATED         │
                                    └──────────┬───────────────┘
                                               ↓
                        ┌──────────────────────┴──────────────────┐
                        │ instantSyncAttach && attachableId?      │
                        ├─────────────────┬───────────────────────┤
                     false                │                    true
                        │                 │                       │
                        ↓                 │                       ↓
                 ✅ FINAL STATE          │        ┌──────────────────────┐
                 (Scenario 1/3)           │        │      ATTACHING       │
                        │                 │        └──────────┬───────────┘
                        │                 │                   ↓
                        │                 │        ┌──────────────────────┐
                        │                 └───────►│      ATTACHED ✅      │
                        │                          └──────────────────────┘
                        │                             FINAL STATE
                        │                             (Scenario 2/4)
                        │
                        ↓
            (Parent creates attachment
             on form save)
                        │
                        ↓
                 ┌──────────────────────┐
                 │    ATTACHED ✅        │
                 └──────────────────────┘
```

### Error Paths (shown in red in actual flow)

At any state, if error occurs:
```
Current State
    ↓ (error)
Previous State
    + errorMessage set
    + retryCount decremented
    ↓ (user clicks Retry)
Current State
    + errorMessage cleared
    + retryCount decremented
    ↓ (retry operation)
```

---

## Summary Comparison Table

| Scenario | instantUpload | instantSyncAttach | attachableId | Initial Final State | Use Case |
|----------|---------------|-------------------|--------------|---------------------|----------|
| **1** ⭐ | `true` | `false` | `null` | `BLOB_CREATED` | **Create/Edit forms** |
| **2** | `true` | `true` | Required | `ATTACHED` | Real-time sync |
| **3** | `false` | `false` | `null` | `SELECTED_FOR_UPLOAD` | Batch upload |
| **4** | `false` | `true` | Required | `SELECTED_FOR_UPLOAD` | Staged sync (rare) |

---

## Best Practices ✅

### DO:
1. ✅ Use **Scenario 1** for most forms (create/edit)
2. ✅ Use **Scenario 2** for simple file uploads to existing entities
3. ✅ Check `hasTransitioningBlobs()` before form submission
4. ✅ Set `processRunning={true}` during form save
5. ✅ Let TanStack/Axios handle automatic network retries
6. ✅ Show manual retry button for user control
7. ✅ Step back one state on errors

### DON'T:
1. ❌ Don't use `instantSyncAttach=true` without `attachableId`
2. ❌ Don't forget to create attachments in Scenario 1
3. ❌ Don't retry automatically in the component (network layer handles that)
4. ❌ Don't modify blobs while `processRunning={true}`
5. ❌ Don't enter a state if previous state has an error

---

## Debugging Tips 🐛

### Log Current State
```typescript
useEffect(() => {
  console.table(blobs.map(b => ({
    name: b.name,
    state: b.state,
    error: b.errorMessage,
    retries: b.retryCount,
    blobId: b.blobId,
    attachmentId: b.attachmentId
  })));
}, [blobs]);
```

### Check Transitioning
```typescript
import { isBlobTransitioning } from 'react-blob-uploader';

blobs.forEach(blob => {
  console.log(`${blob.name}: ${
    isBlobTransitioning(blob, true, false) 
      ? '🔄 transitioning' 
      : '✅ final'
  }`);
});
```

### Monitor State Changes
```typescript
const prevBlobsRef = useRef(blobs);
useEffect(() => {
  blobs.forEach((blob, i) => {
    const prev = prevBlobsRef.current[i];
    if (prev?.state !== blob.state) {
      console.log(`Blob ${blob.name}: ${prev?.state} → ${blob.state}`);
    }
  });
  prevBlobsRef.current = blobs;
}, [blobs]);
```

---

## Conclusion

`react-blob-uploader` supports flexible workflows through 2 simple configuration props:

🎯 **4 scenarios** cover all common use cases  
🔄 **Automatic state machine** handles transitions  
⬅️ **Manual retry** with step-back on errors  
🔒 **ProcessRunning** prevents unwanted interactions  
🎨 **Framework-agnostic** - works with any state management

Choose Scenario 1 for forms, Scenario 2 for real-time, and you're good to go! 🚀

