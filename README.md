# React Blob Uploader

A truly framework-agnostic, production-ready React component for file uploads (images, documents, videos) with drag & drop, manual retry, and cloud direct upload support.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🎨 **Truly Framework-Agnostic** - Flat result structures, works with ANY state management or backend
- 📦 **Self-Contained** - Internal state management, just provide mutation callbacks
- 🎭 **Two Operating Modes** - Immediate sync or batch sync for different use cases
- 🔄 **Drag & Drop Reordering** - Smooth animations powered by @dnd-kit
- 📸 **Main Blob Selection** - Mark a primary file with visual indicators
- ☁️ **Cloud Direct Upload** - Upload directly to S3/cloud storage (no backend bottleneck)
- 🔁 **Manual Retry** - Failed states with retry buttons (no infinite loops)
- 🎯 **TypeScript** - Full type safety with flat result types
- ♿ **Accessible** - WCAG compliant with keyboard navigation
- 🎨 **Customizable** - Style with your own CSS or Tailwind classes
- 🚀 **Performance** - Optimized with React.memo and efficient re-renders
- 📱 **Responsive** - Mobile-friendly touch support
- 🔐 **Secure** - SHA-256 checksums for duplicate detection and integrity verification
- 🔄 **19-State Lifecycle** - Comprehensive state machine with 5 failed states for retry

## 📦 Installation

```bash
npm install github:abdulmughniHamzah/react-blob-uploader
# or
yarn add github:abdulmughniHamzah/react-blob-uploader
# or
pnpm add github:abdulmughniHamzah/react-blob-uploader
```

## 🚀 Quick Start

```tsx
import { useState } from 'react';
import ImageUploader, { PhotoType, MutationCallbacks } from 'react-blob-uploader';

function MyForm() {
  const [photos, setPhotos] = useState<PhotoType[]>([]);
  const [mainPhotoHash, setMainPhotoHash] = useState<string | null>(null);

  // Implement mutation callbacks with FLAT result structures
  const mutations: MutationCallbacks = {
    getUploadUrl: async ({ hash, name, mimeType, size }) => {
      const res = await fetch('/api/upload-url', {
        method: 'POST',
        body: JSON.stringify({ checksum: hash, name, mimeType, size })
      });
      const data = await res.json();
      return {
        success: true,
        hash,
        uploadUrl: data.uploadUrl,
        key: data.key,
      };
    },
    
    directUpload: async ({ hash, uploadUrl, file }) => {
      await fetch(uploadUrl, { method: 'PUT', body: file });
      return { success: true, hash };
    },
    
    createBlob: async ({ hash, key, name, mimeType, size }) => {
      const res = await fetch('/api/blobs', {
        method: 'POST',
        body: JSON.stringify({ key, checksum: hash, name, mimeType, size })
      });
      const data = await res.json();
      return { success: true, hash, id: data.id, key: data.key, url: data.url };
    },
    
    createAttachment: async ({ hash, blobId, attachableId, attachableType }) => {
      const res = await fetch('/api/attachments', {
        method: 'POST',
        body: JSON.stringify({ blobId, attachableId, attachableType })
      });
      const data = await res.json();
      return { success: true, hash, id: data.id };
    },
    
    deleteAttachment: async ({ hash, attachmentId }) => {
      await fetch(`/api/attachments/${attachmentId}`, { method: 'DELETE' });
      return { success: true, hash };
    },
    
    getPreviewUrl: async ({ hash, key }) => {
      return { success: true, hash, previewUrl: key };
    },
  };

  return (
    <ImageUploader
      initialPhotos={photos}
      onPhotosChange={setPhotos}
      mainPhotoHash={mainPhotoHash}
      onMainPhotoChange={setMainPhotoHash}
      mutations={mutations}
      maxPhotos={10}
      attachableId={null}
      isImmediateSyncMode={false}
      syncPhotos={false}
    />
  );
}
```

## 📚 Core Concepts

### State-Agnostic Design

This component doesn't care about your state management. It only requires:
- **State** as props (photos array, mainPhotoHash)
- **Callbacks** to update state (addPhoto, removePhoto, etc.)

You implement state management however you want:

```tsx
// With useState (local state)
const [photos, setPhotos] = useState<PhotoType[]>([]);

// With Redux
const photos = useSelector(state => state.photos);
const dispatch = useDispatch();

// With Zustand
const photos = useStore(state => state.photos);
const addPhoto = useStore(state => state.addPhoto);

// With Context API
const { photos, addPhoto } = usePhotoContext();
```

### Cloud Direct Upload Pattern

The component supports the **cloud direct upload** pattern:

1. **Frontend** requests presigned URL from your backend
2. **Frontend** uploads file **directly to S3/cloud** (no backend bottleneck)
3. **Backend** only handles metadata (blob records, attachments)

**Benefits:**
- ✅ Faster uploads (direct to cloud)
- ✅ Reduced backend load
- ✅ Better scalability
- ✅ Built-in retry (3 automatic retries with exponential backoff)

### Two Operating Modes

#### Mode 1: Immediate Sync (`isImmediateSyncMode: true`)
- User selects image → **immediately starts upload**
- Direct upload to cloud → create blob → create attachment
- Best for: Profile pictures, galleries, simple forms

#### Mode 2: Batch Sync (`isImmediateSyncMode: false`)
- User selects/removes images → **changes stay in UI only**
- User clicks "Save" → all uploads/deletions execute
- Once all synced → submit main form
- Best for: Edit forms, multi-field forms where user reviews before committing

## 🎯 BlobType Interface

```typescript
export interface BlobType {
  errorMessage: string | null;
  key: string | null;              // S3/cloud key
  name: string | null;              // Original filename
  uploadUrl: string | null;         // Presigned upload URL
  previewUrl: string | null;        // CDN preview URL
  mimeType: string | null;          // e.g., 'image/jpeg'
  size: number | null;              // File size in bytes
  checksum: string | null;          // SHA-256 hash (also called 'hash')
  attachmentId: number | null;      // DB attachment ID
  blobId: number | null;            // DB blob ID
  state:                            // 19-state lifecycle (14 + 5 failed states)
    | null
    | 'SELECTED_FOR_UPLOAD'
    | 'UPLOADING_URL_GENERATING'
    | 'UPLOADING_URL_GENERATED'
    | 'UPLOADING_URL_GENERATION_FAILED'  // 🔴 User must retry
    | 'UPLOADING'
    | 'UPLOADED'
    | 'UPLOAD_FAILED'                     // 🔴 User must retry
    | 'BLOB_CREATING'
    | 'BLOB_CREATED'
    | 'BLOB_CREATION_FAILED'              // 🔴 User must retry
    | 'ATTACHING'
    | 'ATTACHED'
    | 'ATTACHMENT_FAILED'                 // 🔴 User must retry
    | 'MARKED_FOR_DETACH'
    | 'DETACHING'
    | 'DETACHED'
    | 'DETACHMENT_FAILED';                // 🔴 User must retry
}

// PhotoType is alias for backward compatibility
export type PhotoType = BlobType;
```

## 📖 API Reference

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `initialPhotos` | `PhotoType[]` | ❌ | Initial blobs (for editing) |
| `onPhotosChange` | `(photos: PhotoType[]) => void` | ❌ | Callback when blobs change |
| `mainPhotoHash` | `string \| null` | ❌ | Checksum of main blob |
| `onMainPhotoChange` | `(hash: string \| null) => void` | ❌ | Callback when main blob changes |
| `mutations` | `MutationCallbacks` | ✅ | **Required** - API mutation callbacks |
| `attachableId` | `number \| null` | ✅ | **Required** - Entity ID to attach to |
| `attachableType` | `string` | ❌ | Entity type (default: 'Offer') |
| `isImmediateSyncMode` | `boolean` | ❌ | true = immediate upload (default: false) |
| `syncPhotos` | `boolean` | ❌ | true = create attachments (default: false) |
| `maxPhotos` | `number` | ❌ | Max blobs allowed (default: 10) |
| `processRunning` | `boolean` | ❌ | Disable interactions while saving |
| `styling` | `StylingProps` | ❌ | Custom CSS classes |

### Mutation Callbacks (FLAT Result Structures)

All mutations return flat structures with hash:

```typescript
interface MutationCallbacks {
  getUploadUrl: (params: {hash, name, mimeType, size}) 
    => Promise<{success: true, hash, uploadUrl, key} | {success: false, hash, error}>;
    
  directUpload: (params: {hash, uploadUrl, file}) 
    => Promise<{success: true, hash} | {success: false, hash, error}>;
    
  createBlob: (params: {hash, key, name, mimeType, size}) 
    => Promise<{success: true, hash, id, key, url} | {success: false, hash, error}>;
    
  createAttachment: (params: {hash, blobId, attachableId, attachableType}) 
    => Promise<{success: true, hash, id} | {success: false, hash, error}>;
    
  deleteAttachment: (params: {hash, attachmentId}) 
    => Promise<{success: true, hash} | {success: false, hash, error}>;
    
  getPreviewUrl: (params: {hash, key}) 
    => Promise<{success: true, hash, previewUrl} | {success: false, hash, error}>;
}
```

## 💡 Usage Examples

### With Redux

```tsx
import { useDispatch, useSelector } from 'react-redux';
import ImageUploader from 'react-image-uploader';

function MyForm() {
  const dispatch = useDispatch();
  const { photos, mainPhotoHash } = useSelector(state => state.form);

  return (
    <ImageUploader
      photos={photos}
      mainPhotoHash={mainPhotoHash}
      addPhoto={(photo) => dispatch(addPhoto(photo))}
      removePhotoByHash={(hash) => dispatch(removePhotoByHash(hash))}
      // ... other callbacks
    />
  );
}
```

### With Zustand

```tsx
import create from 'zustand';
import ImageUploader from 'react-image-uploader';

const useStore = create((set) => ({
  photos: [],
  mainPhotoHash: null,
  addPhoto: (photo) => set((state) => ({ 
    photos: [...state.photos, photo] 
  })),
  removePhoto: (hash) => set((state) => ({
    photos: state.photos.filter(p => p.checksum !== hash)
  })),
}));

function MyForm() {
  const { photos, mainPhotoHash, addPhoto, removePhoto } = useStore();

  return (
    <ImageUploader
      photos={photos}
      mainPhotoHash={mainPhotoHash}
      addPhoto={addPhoto}
      removePhotoByHash={removePhoto}
      // ... other callbacks
    />
  );
}
```

## 🔧 Implementing Mutation Callbacks

All mutation callbacks return **FLAT result structures** with hash included:

```tsx
import { MutationCallbacks } from 'react-blob-uploader';

const mutations: MutationCallbacks = {
  // 1. Get presigned S3 URL - Returns flat {success, hash, uploadUrl, key}
  getUploadUrl: async ({ hash, name, mimeType, size }) => {
    try {
      const res = await fetch('/api/upload-url', {
        method: 'POST',
        body: JSON.stringify({ checksum: hash, name, mimeType, size })
      });
      const data = await res.json();
      
      return {
        success: true,
        hash,
        uploadUrl: data.uploadUrl,
        key: data.key,
      };
    } catch (error) {
      return {
        success: false,
        hash,
        error: error.message || 'Failed to get upload URL',
      };
    }
  },

  // 2. Upload directly to S3 - Returns flat {success, hash}
  directUpload: async ({ hash, uploadUrl, file }) => {
    try {
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      });
      
      return { success: true, hash };
    } catch (error) {
      return {
        success: false,
        hash,
        error: error.message || 'Failed to upload file',
      };
    }
  },

  // 3. Create blob record - Returns flat {success, hash, id, key, url}
  createBlob: async ({ hash, key, name, mimeType, size }) => {
    try {
      const res = await fetch('/api/blobs', {
        method: 'POST',
        body: JSON.stringify({ key, checksum: hash, name, mimeType, size })
      });
      const data = await res.json();
      
      return {
        success: true,
        hash,
        id: data.id,
        key: data.key,
        url: data.url,
      };
    } catch (error) {
      return {
        success: false,
        hash,
        error: error.message || 'Failed to create blob',
      };
    }
  },

  // 4. Link blob to entity - Returns flat {success, hash, id}
  createAttachment: async ({ hash, blobId, attachableId, attachableType }) => {
    try {
      const res = await fetch('/api/attachments', {
        method: 'POST',
        body: JSON.stringify({ blobId, attachableId, attachableType })
      });
      const data = await res.json();
      
      return { success: true, hash, id: data.id };
    } catch (error) {
      return {
        success: false,
        hash,
        error: error.message || 'Failed to create attachment',
      };
    }
  },

  // 5. Delete attachment - Returns flat {success, hash}
  deleteAttachment: async ({ hash, attachmentId }) => {
    try {
      await fetch(`/api/attachments/${attachmentId}`, {
        method: 'DELETE'
      });
      
      return { success: true, hash };
    } catch (error) {
      return {
        success: false,
        hash,
        error: error.message || 'Failed to delete attachment',
      };
    }
  },

  // 6. Get preview URL - Returns flat {success, hash, previewUrl}
  getPreviewUrl: async ({ hash, key }) => {
    return { success: true, hash, previewUrl: key };
  },
};
```

### **Key Points:**
- ✅ All callbacks receive `hash` as first param
- ✅ All callbacks return `hash` in result (success AND error)
- ✅ All results are FLAT (no nested `data` object)
- ✅ Component is isolated from your data structures

## 🔁 Error Handling & Retry

### **Failed States with Manual Retry**

The component includes **5 terminal failed states** that prevent infinite loops:

```typescript
'UPLOADING_URL_GENERATION_FAILED'  // Failed to get upload URL
'UPLOAD_FAILED'                     // Failed to upload to S3
'BLOB_CREATION_FAILED'              // Failed to create blob record
'ATTACHMENT_FAILED'                 // Failed to create attachment
'DETACHMENT_FAILED'                 // Failed to delete attachment
```

**Why This Matters:**
- ❌ **Without failed states:** Failure → Previous state → Auto-retry → Infinite loop
- ✅ **With failed states:** Failure → FAILED state → Shows retry button → User controls retry

### **Visual Feedback on Errors:**

When a blob enters a failed state:
- 🔴 **Red border** around the blob
- 🔘 **Dimmed image** (50% opacity)
- ⚠️ **Error message** displayed
- 🔄 **Retry button** appears

### **Retry Flow:**

```typescript
// User uploads file
SELECTED_FOR_UPLOAD
  ↓
UPLOADING_URL_GENERATING
  ↓ (API fails)
UPLOADING_URL_GENERATION_FAILED ← STOPS HERE
  ↓ (user clicks retry button)
SELECTED_FOR_UPLOAD ← Restarts process
  ↓
... continues normally
```

### **How to Handle Errors:**

```tsx
// Your mutation callback
getUploadUrl: async ({ hash, name, mimeType, size }) => {
  try {
    const response = await api.post('/upload-url', {...});
    return {
      success: true,
      hash,
      uploadUrl: response.data.uploadUrl,
      key: response.data.key,
    };
  } catch (error) {
    // Component will show retry button automatically
    return {
      success: false,
      hash,
      error: error.message || 'Failed to get upload URL',
    };
  }
}
```

## 🎨 Styling & Customization

The component uses **100% Tailwind CSS** with NO custom CSS variables. Every element is fully customizable.

### **14 Customizable Elements:**

```typescript
import ImageUploader, { StylingProps } from 'react-blob-uploader';

const customStyling: StylingProps = {
  containerClassName: 'flex flex-wrap gap-4',
  uploadButtonClassName: 'w-32 h-32 border-primary bg-primary-light',
  blobContainerClassName: 'w-32 h-32 rounded-xl border-2',
  blobImageClassName: 'w-full h-full object-cover',
  blobContainerFailedClassName: 'ring-2 ring-red-500',
  blobImageFailedClassName: 'opacity-50',
  removeButtonClassName: 'absolute top-2 right-2 bg-red-600',
  removeButtonIconClassName: 'w-4 h-4',
  mainBlobBadgeClassName: 'absolute bottom-2 left-2 bg-blue-600',
  setMainButtonClassName: 'absolute bottom-2 left-2 bg-white',
  loadingContainerClassName: 'absolute inset-0 bg-black/40',
  loadingSpinnerClassName: 'text-white animate-spin w-8 h-8',
  errorContainerClassName: 'absolute bottom-0 left-0 right-0 bg-red-600',
  errorMessageClassName: 'text-xs text-white',
  retryButtonClassName: 'px-2 py-1 bg-white text-red-600',
};

<ImageUploader
  {...props}
  styling={customStyling}  // Pass your custom styles
/>
```

### **Quick Examples:**

#### **Match Your Theme:**
```tsx
const themedStyling = {
  uploadButtonClassName: 'w-32 h-32 border-primary bg-background hover:bg-accent',
  mainBlobBadgeClassName: 'bg-primary text-primary-foreground',
  retryButtonClassName: 'bg-destructive text-destructive-foreground',
};
```

#### **Dark Mode:**
```tsx
const darkStyling = {
  uploadButtonClassName: 'border-gray-600 bg-gray-800 text-gray-300',
  blobContainerClassName: 'bg-gray-800 border-gray-700',
  mainBlobBadgeClassName: 'bg-blue-500',
};
```

**See [STYLING_GUIDE.md](./STYLING_GUIDE.md) for complete documentation.**

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT © Abi

## 🙏 Credits

Built with:
- [@dnd-kit](https://github.com/clauderic/dnd-kit) - Drag and drop
- [lucide-react](https://github.com/lucide-icons/lucide) - Icons
- Built in production at [Cellifi](https://cellifi.com)

## 📊 Why This Library?

- ✅ **Production-tested** - Used in real-world applications
- ✅ **State-agnostic** - Works with any state management
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Flexible** - Adapts to your architecture
- ✅ **Modern** - Uses latest React patterns
- ✅ **Maintained** - Active development

## 📞 Support

- 🐛 [Report bugs](https://github.com/abdulmughniHamzah/react-image-uploader/issues)
- 💡 [Request features](https://github.com/abdulmughniHamzah/react-image-uploader/issues)
- 📖 [Documentation](https://github.com/abdulmughniHamzah/react-image-uploader#readme)

---

Made with ❤️ by [Abi](https://github.com/abdulmughniHamzah)
