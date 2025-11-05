# ImageUploader - State Management Guide

## 🎯 Philosophy

**ImageUploader is a pure, state-agnostic component** that can be shipped as a standalone library. It doesn't depend on any specific state management pattern (Redux, Zustand, Context API, local state, etc.).

The component only requires **callback functions** - how you manage state is completely up to you.

---

## 📦 Core Principle: Callbacks, Not State Management

```typescript
<ImageUploader
  photos={photos}                                    // Array of photos
  mainPhotoHash={mainPhotoHash}                      // Current main photo
  addPhoto={(photo) => /* your logic */}             // Add photo callback
  removePhotoByHash={(hash) => /* your logic */}     // Remove photo callback
  setMainPhotoHash={(hash) => /* your logic */}      // Set main photo callback
  getUploadUrl={(hash) => /* your logic */}          // Get S3 URL callback
  directUpload={(hash, file) => /* your logic */}    // Upload to S3 callback
  createBlob={(hash) => /* your logic */}            // Create blob record callback
  createAttachment={(hash, id) => /* your logic */}  // Attach to entity callback
  getPreviewUrl={(hash) => /* your logic */}         // Get preview URL callback
  deleteAttachment={(hash) => /* your logic */}      // Delete attachment callback
  // ... other callbacks
/>
```

**The component doesn't care HOW you implement these callbacks.**

---

## 📚 Usage Examples by State Management Pattern

### 1. **Local State (React.useState)** ⭐ Most Portable

Perfect for:
- Standalone library usage
- Simple forms
- Proof of concept
- No state management library needed

```typescript
import { useState } from 'react';
import ImageUploader from '@/components/ImageUploader';
import PhotoType from '@/types/photo';
import { 
  useGetUploadUrl, 
  useDirectUpload, 
  useCreateBlob,
  useCreateAttachment,
  useGetPreviewUrl,
  useDeleteAttachment 
} from '@/hooks/manage/listings/images';

const MyForm = () => {
  // Local state
  const [photos, setPhotos] = useState<PhotoType[]>([]);
  const [mainPhotoHash, setMainPhotoHash] = useState<string | null>(null);
  const [syncPhotos, setSyncPhotos] = useState(false);

  // TanStack mutations (state-agnostic)
  const getUploadUrlMutation = useGetUploadUrl({
    photos,
    dispatch: (action: any) => {
      // Update local state instead of Redux
      const { type, payload } = action;
      setPhotos(prev => prev.map(p => 
        p.checksum === payload.hash 
          ? { ...p, ...payload } 
          : p
      ));
    },
    actions: {
      setPhotoState: (payload) => ({ type: 'SET_STATE', payload }),
      setPhotoUploadUrl: (payload) => ({ type: 'SET_URL', payload }),
      // ... other action creators
    }
  });

  // Or simpler: direct callbacks
  const handleAddPhoto = (photo: PhotoType) => {
    setPhotos(prev => [...prev, photo]);
  };

  const handleRemovePhoto = (hash: string) => {
    setPhotos(prev => prev.filter(p => p.checksum !== hash));
    if (mainPhotoHash === hash) {
      setMainPhotoHash(null);
    }
  };

  const handleSetPhotoState = (hash: string, state: PhotoType['state']) => {
    setPhotos(prev => prev.map(p => 
      p.checksum === hash ? { ...p, state } : p
    ));
  };

  return (
    <ImageUploader
      photos={photos}
      mainPhotoHash={mainPhotoHash}
      addPhoto={handleAddPhoto}
      removePhotoByHash={handleRemovePhoto}
      removePhotoByKey={(key) => {
        const photo = photos.find(p => p.key === key);
        if (photo?.checksum) handleRemovePhoto(photo.checksum);
      }}
      setMainPhotoHash={setMainPhotoHash}
      resetMainPhotoHash={() => setMainPhotoHash(null)}
      setPhotoState={handleSetPhotoState}
      setPhotos={setPhotos}
      getUploadUrl={(hash) => getUploadUrlMutation.mutate({ checksum: hash })}
      directUpload={(hash, file) => directUploadMutation.mutate({ checksum: hash, file })}
      createBlob={(hash) => createBlobMutation.mutate({ checksum: hash })}
      createAttachment={(hash, id) => createAttachmentMutation.mutate({ checksum: hash, attachableId: id, attachableType: 'Offer' })}
      getPreviewUrl={(hash) => getPreviewUrlMutation.mutate({ checksum: hash })}
      deleteAttachment={(hash) => deleteAttachmentMutation.mutate({ checksum: hash })}
      isImmediateSyncMode={false}
      syncPhotos={syncPhotos}
      maxPhotos={10}
      attachableId={null}
      processRunning={false}
    />
  );
};
```

---

### 2. **Redux (with useImageUploaderIntegration helper)**

Perfect for:
- Large applications with centralized state
- Time-travel debugging
- Complex state management needs

```typescript
import { useAppDispatch, useAppSelector, useImageUploaderIntegration } from '@/hooks';
import { 
  addPhoto, 
  removePhotoByHash, 
  setMainPhotoHash,
  setPhotoState,
  setPhotoUploadUrl,
  // ... other actions
} from '@/store/slices/yourSlice';

const MyForm = () => {
  const dispatch = useAppDispatch();
  const { photos, mainPhotoHash } = useAppSelector(state => state.yourSlice);

  // Redux actions (memoized for stability)
  const actions = useMemo(() => ({
    setPhotoState,
    setPhotoUploadUrl,
    setPhotoKey,
    setPhotoBlobId,
    setPhotoAttachmentId,
    setPhotoPreviewUrl,
    setPhotoErrorMessage,
    resetPhotoErrorMessage,
    addPhoto,
    removePhotoByHash,
    setMainPhotoHash,
    setPhotos,
  }), []);

  // Use the Redux adapter hook (convenience)
  const imageUploader = useImageUploaderIntegration({
    photos,
    mainPhotoHash,
    dispatch,
    actions,
  });

  return (
    <ImageUploader
      {...imageUploader.callbacks}
      isImmediateSyncMode={false}
      syncPhotos={syncPhotos}
      maxPhotos={10}
      attachableId={offerId}
      processRunning={isSaving}
    />
  );
};
```

---

### 3. **Zustand**

Perfect for:
- Modern, lightweight state management
- Simple API
- No boilerplate

```typescript
import create from 'zustand';
import ImageUploader from '@/components/ImageUploader';

// Zustand store
const usePhotoStore = create((set) => ({
  photos: [],
  mainPhotoHash: null,
  addPhoto: (photo) => set((state) => ({ 
    photos: [...state.photos, photo] 
  })),
  removePhoto: (hash) => set((state) => ({ 
    photos: state.photos.filter(p => p.checksum !== hash),
    mainPhotoHash: state.mainPhotoHash === hash ? null : state.mainPhotoHash
  })),
  setMainPhotoHash: (hash) => set({ mainPhotoHash: hash }),
  updatePhotoState: (hash, newState) => set((state) => ({
    photos: state.photos.map(p => 
      p.checksum === hash ? { ...p, state: newState } : p
    )
  })),
}));

const MyForm = () => {
  const { photos, mainPhotoHash, addPhoto, removePhoto, setMainPhotoHash, updatePhotoState } = usePhotoStore();

  return (
    <ImageUploader
      photos={photos}
      mainPhotoHash={mainPhotoHash}
      addPhoto={addPhoto}
      removePhotoByHash={removePhoto}
      removePhotoByKey={(key) => {
        const photo = photos.find(p => p.key === key);
        if (photo) removePhoto(photo.checksum);
      }}
      setMainPhotoHash={setMainPhotoHash}
      resetMainPhotoHash={() => setMainPhotoHash(null)}
      setPhotoState={updatePhotoState}
      setPhotos={(newPhotos) => usePhotoStore.setState({ photos: newPhotos })}
      // ... other callbacks
    />
  );
};
```

---

### 4. **Context API**

Perfect for:
- Medium-sized apps
- No external dependencies
- Built-in React solution

```typescript
import { createContext, useContext, useReducer } from 'react';

// Context and reducer
const PhotoContext = createContext(null);

const photoReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_PHOTO':
      return { ...state, photos: [...state.photos, action.payload] };
    case 'REMOVE_PHOTO':
      return { 
        ...state, 
        photos: state.photos.filter(p => p.checksum !== action.payload),
        mainPhotoHash: state.mainPhotoHash === action.payload ? null : state.mainPhotoHash
      };
    case 'SET_MAIN_PHOTO':
      return { ...state, mainPhotoHash: action.payload };
    case 'UPDATE_PHOTO':
      return {
        ...state,
        photos: state.photos.map(p =>
          p.checksum === action.payload.hash 
            ? { ...p, ...action.payload.updates }
            : p
        )
      };
    default:
      return state;
  }
};

const PhotoProvider = ({ children }) => {
  const [state, dispatch] = useReducer(photoReducer, { photos: [], mainPhotoHash: null });
  return (
    <PhotoContext.Provider value={{ state, dispatch }}>
      {children}
    </PhotoContext.Provider>
  );
};

const MyForm = () => {
  const { state, dispatch } = useContext(PhotoContext);

  return (
    <ImageUploader
      photos={state.photos}
      mainPhotoHash={state.mainPhotoHash}
      addPhoto={(photo) => dispatch({ type: 'ADD_PHOTO', payload: photo })}
      removePhotoByHash={(hash) => dispatch({ type: 'REMOVE_PHOTO', payload: hash })}
      setMainPhotoHash={(hash) => dispatch({ type: 'SET_MAIN_PHOTO', payload: hash })}
      setPhotoState={(hash, newState) => dispatch({ 
        type: 'UPDATE_PHOTO', 
        payload: { hash, updates: { state: newState } }
      })}
      // ... other callbacks
    />
  );
};
```

---

### 5. **Jotai (Atomic State)**

Perfect for:
- Bottom-up state management
- Fine-grained reactivity
- Minimal re-renders

```typescript
import { atom, useAtom } from 'jotai';
import ImageUploader from '@/components/ImageUploader';

// Atoms
const photosAtom = atom<PhotoType[]>([]);
const mainPhotoHashAtom = atom<string | null>(null);

const MyForm = () => {
  const [photos, setPhotos] = useAtom(photosAtom);
  const [mainPhotoHash, setMainPhotoHash] = useAtom(mainPhotoHashAtom);

  return (
    <ImageUploader
      photos={photos}
      mainPhotoHash={mainPhotoHash}
      addPhoto={(photo) => setPhotos(prev => [...prev, photo])}
      removePhotoByHash={(hash) => {
        setPhotos(prev => prev.filter(p => p.checksum !== hash));
        if (mainPhotoHash === hash) setMainPhotoHash(null);
      }}
      setMainPhotoHash={setMainPhotoHash}
      setPhotoState={(hash, state) => setPhotos(prev => 
        prev.map(p => p.checksum === hash ? { ...p, state } : p)
      )}
      // ... other callbacks
    />
  );
};
```

---

## 🔧 Creating Your Own Adapter

If you want to create an adapter for a different state management library:

```typescript
// useImageUploaderYourLibrary.ts
import { useMemo } from 'react';
import PhotoType from '@/types/photo';
import { /* your state management hooks */ } from 'your-library';
import { /* TanStack mutations */ } from '@/hooks/manage/listings/images';

export const useImageUploaderYourLibrary = ({
  photos,
  mainPhotoHash,
  // your state management specific params
}) => {
  const callbacks = useMemo(() => ({
    addPhoto: (photo: PhotoType) => {
      // your implementation
    },
    removePhotoByHash: (hash: string) => {
      // your implementation
    },
    setMainPhotoHash: (hash: string) => {
      // your implementation
    },
    // ... other callbacks
  }), [/* dependencies */]);

  return { callbacks };
};
```

---

## 📦 Publishing as a Library

To publish ImageUploader as a standalone library:

### What to Include:
```
image-uploader/
├── src/
│   ├── ImageUploader/        # Core component (state-agnostic)
│   ├── Photo.tsx              # Sub-component
│   ├── SortablePhoto.tsx      # Drag & drop wrapper
│   ├── Uploader.tsx           # Main component logic
│   ├── propsType.ts           # TypeScript types
│   ├── types/
│   │   └── photo.ts           # PhotoType interface
│   └── utils/
│       └── checksum.ts        # SHA-256 utility
├── docs/
│   ├── README.md              # Main docs
│   ├── STATE_MANAGEMENT_GUIDE.md  # This file
│   └── EXAMPLES.md            # Usage examples
└── package.json
```

### What NOT to Include:
- ❌ Redux-specific code
- ❌ TanStack Query hooks (or make them optional peer dependencies)
- ❌ Application-specific business logic

### package.json (example):
```json
{
  "name": "@yourorg/image-uploader",
  "version": "1.0.0",
  "description": "State-agnostic multi-image uploader with drag & drop",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "peerDependencies": {
    "react": ">=18.0.0",
    "@dnd-kit/core": "^6.0.0",
    "@dnd-kit/sortable": "^7.0.0"
  },
  "optionalDependencies": {
    "@tanstack/react-query": "^4.0.0"
  }
}
```

---

## ✅ Summary

| Aspect | Status |
|--------|--------|
| **State Management** | ❌ NO dependency on Redux, Zustand, or any specific library |
| **Pure Component** | ✅ Only receives callbacks as props |
| **Portability** | ✅ Can be used in any React app |
| **Library-Ready** | ✅ Can be published to npm/GitHub |
| **Flexibility** | ✅ Works with useState, Redux, Zustand, Context, Jotai, etc. |

**The ImageUploader component is completely decoupled from state management.**

The `useImageUploaderIntegration` hook is just a **convenience adapter for Redux users** - it's optional and doesn't affect the component's portability.

