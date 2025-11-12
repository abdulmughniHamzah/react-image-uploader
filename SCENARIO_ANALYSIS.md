# React Blob Uploader - Scenario Analysis & Validation

## Overview
This document analyzes two specific usage scenarios and validates that `react-blob-uploader` can support them with its current architecture.

---

## Scenario 1: Create Listing Form (Instant Upload, No Attachment)

### Requirements:
1. **Behavior**: When file is added (picked), start upload process immediately
2. **Flow**: `SELECTED_FOR_UPLOAD` → ... → `BLOB_CREATED`
3. **Configuration**: `instantUpload=true`, `instantSyncAttach=false`
4. **Remove Logic**: 
   - If blob state is `ATTACHED`: transition to `DETACHED` and unlink
   - Otherwise: just `unlinkBlob()`

### Current Implementation Status:

#### ✅ **Upload Flow - FULLY SUPPORTED**

The state machine in `Blob.tsx` lines 92-137:

```typescript
case 'SELECTED_FOR_UPLOAD':
  if (instantUpload && blob.name && blob.mimeType && blob.size && !blob.errorMessage) {
    setBlob(hash, { state: 'UPLOADING_URL_GENERATING' });
    
    const result = await mutations.getUploadUrl({...});
    if (result.success) {
      if (result.uploadUrl) {
        setBlob(hash, { state: 'UPLOADING_URL_GENERATED' });
      } else if (result.blobId && result.key) {
        setBlob(hash, { state: 'BLOB_CREATED' }); // Direct to BLOB_CREATED
      }
    }
  }
  break;
```

**Flow**:
1. User selects file → `SELECTED_FOR_UPLOAD` (with checksum calculated)
2. `instantUpload=true` triggers → `UPLOADING_URL_GENERATING`
3. Get presigned URL → `UPLOADING_URL_GENERATED`
4. Upload to S3 → `UPLOADING` → `UPLOADED`
5. Create blob record → `BLOB_CREATING` → `BLOB_CREATED` ✅
6. Since `instantSyncAttach=false`, stops at `BLOB_CREATED` ✅

#### ✅ **Remove Logic - FULLY SUPPORTED**

The `handleRemoveBlob` function in `Blob.tsx` lines 50-63:

```typescript
const handleRemoveBlob = () => {
  if (!blob.checksum) return;

  if (blob.state === 'ATTACHED') {
    if (instantSyncAttach) {  
      setBlob(blob.checksum, { state: 'MARKED_FOR_DETACH' });
    } else {
      setBlob(blob.checksum, { state: 'DETACHED' });
    }
  } else {
    unlinkBlob(); // Just remove from list
  }
};
```

**Behavior**:
- If `state === 'ATTACHED'` and `instantSyncAttach=false`: → `DETACHED` → `unlinkBlob()` ✅
- Otherwise (including `BLOB_CREATED`): → `unlinkBlob()` immediately ✅

#### ✅ **Final State Detection - FULLY SUPPORTED**

`isBlobTransitioning()` in `blobHelpers.ts` lines 17-47:

```typescript
// If instantUpload is true but instantSyncAttach is false
// Final states are: BLOB_CREATED, ATTACHED
if (!instantSyncAttach) {
  return state !== 'BLOB_CREATED' && state !== 'ATTACHED';
}
```

**Result**: `BLOB_CREATED` is correctly identified as a final state ✅

---

## Scenario 2: Edit Listing Form (Dynamic Upload Control)

### Requirements:
1. **Initial State**: `instantUpload=false` (images stay at `SELECTED_FOR_UPLOAD`)
2. **On Save**: Switch `instantUpload=true` to trigger synchronization
3. **Configuration**: `instantSyncAttach=false` (always)
4. **Form Integration**:
   - Save button disabled when `hasTransitioningBlobs()` returns true
   - Save button shows "Saving..." during transitions
   - Uploader buttons disabled via `processRunning={isSaving}`
   - User feedback: disabled buttons OR toast messages

### Current Implementation Status:

#### ⚠️ **Dynamic `instantUpload` Toggle - PARTIALLY SUPPORTED**

**Issue**: The `instantUpload` prop is passed to the `Blob` component and used in the `useEffect` dependency array (line 273-283), which means:
- ✅ Changes to `instantUpload` will trigger the state machine re-evaluation
- ✅ Blobs stuck at `SELECTED_FOR_UPLOAD` will start uploading when `instantUpload` changes from `false` to `true`

**However**, there's a UX consideration:

```typescript
useEffect(() => {
  const handleStateTransition = async () => {
    // ...state machine logic
  };
  handleStateTransition();
}, [
  file,
  attachableId,
  attachableType,
  instantUpload,  // ✅ Re-runs when this changes
  instantSyncAttach,
  blob.state,
  blob.checksum,
  blob.errorMessage,
  setBlob,
  mutations,
]);
```

**Status**: ✅ **WORKS** - When parent changes `instantUpload` from `false` to `true`, all blobs at `SELECTED_FOR_UPLOAD` will automatically progress through the upload flow.

#### ✅ **Save Button Integration - FULLY SUPPORTED**

The `hasTransitioningBlobs()` helper correctly identifies transitioning states:

```typescript
// From blobHelpers.ts
export function hasTransitioningBlobs(
  blobs: BlobType[],
  instantUpload: boolean,
  instantSyncAttach: boolean
): boolean {
  return blobs.some((blob) => isBlobTransitioning(blob, instantUpload, instantSyncAttach));
}
```

**Usage in Edit Form** (should be):
```typescript
const hasPhotosInTransition = useCallback(() => {
  return hasTransitioningBlobs(formState.photos, INSTANT_UPLOAD, INSTANT_SYNC_ATTACH);
}, [formState.photos, INSTANT_UPLOAD, INSTANT_SYNC_ATTACH]);
```

**FormController**:
```typescript
const isReadyToSave = () => {
  return !isLoading && !isSaving && !isRefetching && hasChanges && !hasPhotosInTransition();
};
```

**Result**: Save button correctly disabled during transitions ✅

#### ✅ **Upload Button Disabled - FULLY SUPPORTED**

The `processRunning` prop disables the upload button (line 172):

```typescript
{blobs.length < maxItems && !processRunning && (
  <label className={styling.uploadButtonClassName}>
    <input type='file' accept='image/*' multiple onChange={handleFiles} />
  </label>
)}
```

**Result**: Upload button hidden/disabled when `processRunning={true}` ✅

#### ⚠️ **Individual Blob Button Interactions - NEEDS ENHANCEMENT**

**Current State**:
- Remove button: Always enabled, no `processRunning` check
- Set Main button: Always enabled, no `processRunning` check
- Retry button: Always enabled, no `processRunning` check

**Issue**: During form submission (`isSaving=true`), user can still:
- Remove blobs
- Change main blob
- Retry failed uploads

**Recommendation**: Add `processRunning` prop to individual blob buttons for consistency.

---

## Issues & Recommendations

### 🔴 Issue 1: Blob Buttons Not Respecting `processRunning`

**Location**: `Blob.tsx` lines 337-364

**Current Code**:
```typescript
{/* Remove button */}
<button
  type='button'
  onClick={handleRemoveBlob}
  className={styling.removeButtonClassName}
  title='Remove blob'
>
  <X />
</button>

{/* Set as main blob button */}
{mainBlobHash !== blob.checksum && 
 (blob.state === 'ATTACHED' || blob.state === 'BLOB_CREATED') && (
  <button
    type='button'
    onClick={() => setMainBlobHash(blob.checksum!)}
    className={styling.setMainButtonClassName}
  >
    Set Main
  </button>
)}
```

**Required Fix**:
```typescript
{/* Remove button */}
<button
  type='button'
  onClick={handleRemoveBlob}
  disabled={processRunning}
  className={`${styling.removeButtonClassName} ${processRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
  title={processRunning ? 'Form is processing' : 'Remove blob'}
>
  <X />
</button>

{/* Set as main blob button */}
{mainBlobHash !== blob.checksum && 
 (blob.state === 'ATTACHED' || blob.state === 'BLOB_CREATED') && (
  <button
    type='button'
    onClick={() => setMainBlobHash(blob.checksum!)}
    disabled={processRunning}
    className={`${styling.setMainButtonClassName} ${processRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
    title={processRunning ? 'Form is processing' : 'Set as main blob'}
  >
    Set Main
  </button>
)}

{/* Retry button */}
{canRetry && (
  <button
    type='button'
    onClick={handleRetry}
    disabled={processRunning}
    className={`${styling.retryButtonClassName} ${processRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
    title={processRunning ? 'Form is processing' : 'Retry upload'}
  >
    Retry
  </button>
)}
```

**Impact**: Medium - UX inconsistency, user can modify blobs during form submission

---

### 🟡 Issue 2: Edit Form Missing Dynamic `instantUpload` Toggle

**Location**: `mp/src/app/manage/listings/[id]/edit/page.tsx`

**Current Code**:
```typescript
const INSTANT_UPLOAD = false; // Static - never changes
const INSTANT_SYNC_ATTACH = false;
```

**Required Fix**:
```typescript
const [instantUpload, setInstantUpload] = useState(false);
const INSTANT_SYNC_ATTACH = false;

const handleSave = useCallback(async () => {
  if (!listing) return;

  // Check if photos are synced
  if (!allPhotosSynced()) {
    // Start upload process by toggling instantUpload
    setInstantUpload(true);
    
    // Show toast that upload is starting
    toast.info('Uploading images...');
    return; // Don't save yet, wait for uploads to complete
  }

  // All photos synced, proceed with save
  dispatch(setSaving(true));
  // ... rest of save logic
}, [listing, allPhotosSynced, dispatch]);

// Watch for completion after toggle
useEffect(() => {
  if (instantUpload && allPhotosSynced() && !isSaving) {
    // All uploads completed, now save the form
    handleActualSave();
  }
}, [instantUpload, allPhotosSynced, isSaving]);
```

**Impact**: High - This is the core requirement for Scenario 2

---

### 🟢 Issue 3: Missing `processRunning` Prop Pass-Through

**Location**: `Blob.tsx` needs to receive `processRunning`

**Current**: `processRunning` is only checked in `Uploader.tsx` for the upload button

**Required**: Pass `processRunning` to `Blob` component

**Changes Needed**:

1. **Update `BlobProps` interface** (Blob.tsx):
```typescript
interface BlobProps {
  // ... existing props
  processRunning: boolean; // Add this
}
```

2. **Update `Uploader.tsx` to pass prop** (line 198-215):
```typescript
<SortableBlob
  // ... existing props
  processRunning={processRunning} // Add this
  styling={styling}
  filesMap={filesMapRef.current}
/>
```

3. **Update `SortableBlob.tsx` to pass through**:
```typescript
<Blob
  // ... existing props
  processRunning={props.processRunning} // Add this
/>
```

**Impact**: Medium - Required for proper UX consistency

---

## Implementation Checklist

### For `react-blob-uploader` Package:

- [ ] **Add `processRunning` prop to `Blob` component**
  - Update `BlobProps` interface
  - Pass from `Uploader` → `SortableBlob` → `Blob`
  
- [ ] **Disable buttons when `processRunning=true`**
  - Remove button
  - Set Main button
  - Retry button
  
- [ ] **Update button styling for disabled state**
  - Add opacity and cursor styles
  - Update title tooltips

### For MP Edit Form:

- [ ] **Implement dynamic `instantUpload` toggle**
  - Change from `const` to `useState`
  - Toggle on save button click
  - Wait for uploads before submitting form
  
- [ ] **Update `hasPhotosInTransition` to use dynamic value**
  - Use state variable instead of constant
  
- [ ] **Add toast notifications**
  - "Uploading images..." when uploads start
  - "All images uploaded" when complete
  - Error messages for failed uploads

### For MP Create Form:

- [ ] **No changes needed** - Already working correctly ✅

---

## Validation Summary

### Scenario 1 (Create Form): ✅ **FULLY SUPPORTED**
- Upload flow: ✅ Works
- Final state detection: ✅ Works
- Remove logic: ✅ Works
- Button disabling: ⚠️ Needs `processRunning` for blob buttons

### Scenario 2 (Edit Form): ⚠️ **NEEDS IMPLEMENTATION**
- Dynamic `instantUpload`: ✅ Supported by architecture, ⚠️ Needs parent implementation
- Save button integration: ✅ Works
- Upload button disabling: ✅ Works
- Blob button disabling: ⚠️ Needs `processRunning` implementation

---

## Conclusion

**React Blob Uploader is architecturally sound and can support both scenarios with minimal changes:**

1. **Library Changes** (react-blob-uploader):
   - Add `processRunning` prop to `Blob` component
   - Disable all interactive buttons when `processRunning=true`
   - Estimated effort: 1-2 hours

2. **MP Edit Form Changes**:
   - Implement dynamic `instantUpload` toggle
   - Add upload completion detection
   - Add user feedback (toast messages)
   - Estimated effort: 2-3 hours

3. **MP Create Form**:
   - No changes needed ✅

**Total estimated effort**: 3-5 hours of development + testing

The library's state machine and prop-based control system provides the flexibility needed for both scenarios. The main work is in the parent component (MP Edit Form) to orchestrate the dynamic upload triggering.

