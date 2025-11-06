# React Image Uploader DnD

A state-agnostic, production-ready React component for multi-image uploads with drag & drop reordering and cloud direct upload support.

[![npm version](https://img.shields.io/npm/v/react-image-uploader.svg)](https://www.npmjs.com/package/react-image-uploader)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🎨 **State-Agnostic** - Works with useState, Redux, Zustand, Context API, Jotai, or any state management pattern
- 📦 **Zero Configuration** - Works out of the box with sensible defaults
- 🎭 **Two Operating Modes** - Immediate sync or batch sync for different use cases
- 🔄 **Drag & Drop Reordering** - Smooth animations powered by @dnd-kit
- 📸 **Main Image Selection** - Mark a primary image with visual indicators
- ☁️ **Cloud Direct Upload** - Upload directly to S3/cloud storage (no backend bottleneck)
- 🎯 **TypeScript** - Full type safety with exported types
- ♿ **Accessible** - WCAG compliant with keyboard navigation
- 🎨 **Customizable** - Style with your own CSS or Tailwind classes
- 🚀 **Performance** - Optimized with React.memo and efficient re-renders
- 📱 **Responsive** - Mobile-friendly touch support
- 🔐 **Secure** - SHA-256 checksums for duplicate detection and integrity verification
- 🔄 **14-State Lifecycle** - Comprehensive state machine for upload flow

## 📦 Installation

```bash
npm install react-image-uploader
# or
yarn add react-image-uploader
# or
pnpm add react-image-uploader
```

## 🚀 Quick Start

```tsx
import { useState } from 'react';
import ImageUploader, { PhotoType } from 'react-image-uploader';

function MyForm() {
  const [photos, setPhotos] = useState<PhotoType[]>([]);
  const [mainPhotoHash, setMainPhotoHash] = useState<string | null>(null);

  return (
    <ImageUploader
      photos={photos}
      mainPhotoHash={mainPhotoHash}
      addPhoto={(photo) => setPhotos([...photos, photo])}
      removePhotoByHash={(hash) => 
        setPhotos(photos.filter(p => p.checksum !== hash))
      }
      setMainPhotoHash={setMainPhotoHash}
      resetMainPhotoHash={() => setMainPhotoHash(null)}
      setPhotoState={(hash, state) => 
        setPhotos(photos.map(p => 
          p.checksum === hash ? { ...p, state } : p
        ))
      }
      setPhotos={setPhotos}
      removePhotoByKey={(key) => 
        setPhotos(photos.filter(p => p.key !== key))
      }
      // Cloud upload callbacks (implement your own)
      getUploadUrl={async (hash) => {/* Get presigned URL from your API */}}
      directUpload={async (hash, file) => {/* Upload to S3/cloud */}}
      createBlob={async (hash) => {/* Create blob record */}}
      createAttachment={async (hash, id) => {/* Link to entity */}}
      getPreviewUrl={async (hash) => {/* Get CDN URL */}}
      deleteAttachment={async (hash) => {/* Delete attachment */}}
      // Configuration
      isImmediateSyncMode={false}
      syncPhotos={false}
      maxPhotos={10}
      attachableId={null}
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

## 🎯 PhotoType Interface

```typescript
export interface PhotoType {
  errorMessage: string | null;
  key: string | null;              // S3/cloud key
  name: string | null;              // Original filename
  uploadUrl: string | null;         // Presigned upload URL
  previewUrl: string | null;        // CDN preview URL
  mimeType: string | null;          // e.g., 'image/jpeg'
  size: number | null;              // File size in bytes
  checksum: string | null;          // SHA-256 hash
  attachmentId: number | null;      // DB attachment ID
  blobId: number | null;            // DB blob ID
  state:                            // 14-state lifecycle
    | null
    | 'SELECTED_FOR_UPLOAD'
    | 'UPLOADING_URL_GENERATING'
    | 'UPLOADING_URL_GENERATED'
    | 'UPLOADING'
    | 'UPLOADED'
    | 'BLOB_CREATING'
    | 'BLOB_CREATED'
    | 'ATTACHING'
    | 'ATTACHED'
    | 'MARKED_FOR_DETACH'
    | 'DETACHING'
    | 'DETACHED';
}
```

## 📖 API Reference

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `photos` | `PhotoType[]` | ✅ | Array of photo objects |
| `mainPhotoHash` | `string \| null` | ✅ | Checksum of main photo |
| `addPhoto` | `(photo: PhotoType) => void` | ✅ | Add photo to state |
| `removePhotoByHash` | `(hash: string) => void` | ✅ | Remove photo by checksum |
| `removePhotoByKey` | `(key: string) => void` | ✅ | Remove photo by cloud key |
| `setMainPhotoHash` | `(hash: string) => void` | ✅ | Set main photo |
| `resetMainPhotoHash` | `() => void` | ✅ | Clear main photo |
| `setPhotoState` | `(hash: string, state: PhotoType['state']) => void` | ✅ | Update photo state |
| `setPhotos` | `(photos: PhotoType[]) => void` | ✅ | Replace entire photos array |
| `getUploadUrl` | `(hash: string) => void` | ✅ | Get presigned URL from API |
| `directUpload` | `(hash: string, file: File) => void` | ✅ | Upload to cloud |
| `createBlob` | `(hash: string) => void` | ✅ | Create blob record |
| `createAttachment` | `(hash: string, id: number) => void` | ✅ | Link blob to entity |
| `getPreviewUrl` | `(hash: string) => void` | ✅ | Get CDN preview URL |
| `deleteAttachment` | `(hash: string) => void` | ✅ | Delete attachment |
| `isImmediateSyncMode` | `boolean` | ✅ | Operating mode |
| `syncPhotos` | `boolean` | ✅ | Trigger batch sync |
| `attachableId` | `number \| null` | ✅ | Entity ID to attach to |
| `maxPhotos` | `number` | ❌ | Max photos (default: 10) |
| `processRunning` | `boolean` | ❌ | Disable while saving |

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

## 🔧 Implementing Callbacks

You need to implement the 6 lifecycle callbacks for your specific backend:

```tsx
// 1. Get presigned S3 URL
const getUploadUrl = async (hash: string) => {
  const photo = photos.find(p => p.checksum === hash);
  const res = await fetch('/api/upload-url', {
    method: 'POST',
    body: JSON.stringify({
      filename: photo.name,
      mimeType: photo.mimeType,
      checksum: hash
    })
  });
  const { uploadUrl, key } = await res.json();
  // Update photo state with uploadUrl and key
};

// 2. Upload directly to S3
const directUpload = async (hash: string, file: File) => {
  const photo = photos.find(p => p.checksum === hash);
  await fetch(photo.uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': photo.mimeType }
  });
};

// 3. Create blob record in database
const createBlob = async (hash: string) => {
  const photo = photos.find(p => p.checksum === hash);
  const res = await fetch('/api/blobs', {
    method: 'POST',
    body: JSON.stringify({
      key: photo.key,
      filename: photo.name,
      checksum: hash
    })
  });
  const { id } = await res.json();
  // Update photo state with blobId
};

// 4. Link blob to entity (e.g., Offer, Product)
const createAttachment = async (hash: string, attachableId: number) => {
  const photo = photos.find(p => p.checksum === hash);
  const res = await fetch('/api/attachments', {
    method: 'POST',
    body: JSON.stringify({
      blobId: photo.blobId,
      attachableId,
      attachableType: 'Offer' // or 'Product', 'User', etc.
    })
  });
  const { id } = await res.json();
  // Update photo state with attachmentId
};

// 5. Get CDN preview URL
const getPreviewUrl = async (hash: string) => {
  const photo = photos.find(p => p.checksum === hash);
  const res = await fetch(`/api/blobs/${photo.blobId}/preview`);
  const { previewUrl } = await res.json();
  // Update photo state with previewUrl
};

// 6. Delete attachment
const deleteAttachment = async (hash: string) => {
  const photo = photos.find(p => p.checksum === hash);
  await fetch(`/api/attachments/${photo.attachmentId}`, {
    method: 'DELETE'
  });
};
```

## 🎨 Styling

The component uses standard CSS classes. Customize with your own styles or Tailwind:

```css
/* Main container */
.image-uploader {
  /* Your styles */
}

/* Photo grid */
.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
}

/* Individual photo */
.photo-item {
  position: relative;
  aspect-ratio: 1;
}
```

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
