/**
 * Example: Using ImageUploader with Local State Only
 * 
 * This example demonstrates that ImageUploader is completely state-agnostic
 * and can be used WITHOUT Redux, Zustand, or any state management library.
 * 
 * Perfect for:
 * - Standalone library usage
 * - Simple forms
 * - Proof of concept
 * - Shipping as npm package
 */

import { useState, useCallback } from 'react';
import ImageUploader from './index';
import PhotoType from '@/types/photo';

// Mock API functions (replace with your actual implementation)
const mockGetUploadUrl = async (checksum: string) => {
  // API call to get presigned S3 URL
  return { uploadUrl: 'https://s3.amazonaws.com/...', key: 'photo-key' };
};

const mockDirectUpload = async (uploadUrl: string, file: File) => {
  // Upload file to S3
  await fetch(uploadUrl, { method: 'PUT', body: file });
};

const mockCreateBlob = async (checksum: string, key: string) => {
  // Create blob record in database
  return { id: 123 };
};

const mockCreateAttachment = async (blobId: number, attachableId: number) => {
  // Link blob to entity
  return { id: 456 };
};

const mockGetPreviewUrl = async (blobId: number) => {
  // Get CDN URL for display
  return { previewUrl: 'https://cdn.example.com/photo.jpg' };
};

const mockDeleteAttachment = async (attachmentId: number) => {
  // Delete attachment from database
  await fetch(`/api/attachments/${attachmentId}`, { method: 'DELETE' });
};

/**
 * Example Component Using ImageUploader with Local State
 * NO Redux, NO Zustand, NO Context - just useState!
 */
const PhotoForm = () => {
  // ✅ Local state - no Redux needed
  const [photos, setPhotos] = useState<PhotoType[]>([]);
  const [mainPhotoHash, setMainPhotoHash] = useState<string | null>(null);
  const [syncPhotos, setSyncPhotos] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ✅ Callback: Add photo
  const handleAddPhoto = useCallback((photo: PhotoType) => {
    setPhotos(prev => [...prev, photo]);
  }, []);

  // ✅ Callback: Remove photo
  const handleRemovePhoto = useCallback((hash: string) => {
    setPhotos(prev => prev.filter(p => p.checksum !== hash));
    // Clear main photo if removing it
    if (mainPhotoHash === hash) {
      setMainPhotoHash(null);
    }
  }, [mainPhotoHash]);

  // ✅ Callback: Remove photo by key
  const handleRemovePhotoByKey = useCallback((key: string) => {
    const photo = photos.find(p => p.key === key);
    if (photo?.checksum) {
      handleRemovePhoto(photo.checksum);
    }
  }, [photos, handleRemovePhoto]);

  // ✅ Callback: Update photo state
  const handleSetPhotoState = useCallback((hash: string, state: PhotoType['state']) => {
    setPhotos(prev => prev.map(p => 
      p.checksum === hash ? { ...p, state } : p
    ));
  }, []);

  // ✅ Callback: Set photos (for drag & drop reorder)
  const handleSetPhotos = useCallback((newPhotos: PhotoType[]) => {
    setPhotos(newPhotos);
  }, []);

  // ✅ Callback: Get upload URL
  const handleGetUploadUrl = useCallback(async (hash: string) => {
    const photo = photos.find(p => p.checksum === hash);
    if (!photo) return;

    try {
      // Update state: generating URL
      handleSetPhotoState(hash, 'UPLOADING_URL_GENERATING');

      // API call
      const { uploadUrl, key } = await mockGetUploadUrl(hash);

      // Update state: URL generated
      setPhotos(prev => prev.map(p =>
        p.checksum === hash
          ? { ...p, uploadUrl, key, state: 'UPLOADING_URL_GENERATED' }
          : p
      ));
    } catch (error) {
      // Update state: error
      setPhotos(prev => prev.map(p =>
        p.checksum === hash
          ? { ...p, errorMessage: 'Failed to get upload URL', state: null }
          : p
      ));
    }
  }, [photos, handleSetPhotoState]);

  // ✅ Callback: Direct upload to S3
  const handleDirectUpload = useCallback(async (hash: string, file: File) => {
    const photo = photos.find(p => p.checksum === hash);
    if (!photo?.uploadUrl) return;

    try {
      // Update state: uploading
      handleSetPhotoState(hash, 'UPLOADING');

      // Direct S3 upload
      await mockDirectUpload(photo.uploadUrl, file);

      // Update state: uploaded
      handleSetPhotoState(hash, 'UPLOADED');
    } catch (error) {
      // Update state: error
      setPhotos(prev => prev.map(p =>
        p.checksum === hash
          ? { ...p, errorMessage: 'Upload failed', state: null }
          : p
      ));
    }
  }, [photos, handleSetPhotoState]);

  // ✅ Callback: Create blob
  const handleCreateBlob = useCallback(async (hash: string) => {
    const photo = photos.find(p => p.checksum === hash);
    if (!photo?.key) return;

    try {
      // Update state: creating blob
      handleSetPhotoState(hash, 'BLOB_CREATING');

      // API call
      const { id: blobId } = await mockCreateBlob(hash, photo.key);

      // Update state: blob created
      setPhotos(prev => prev.map(p =>
        p.checksum === hash
          ? { ...p, blobId, state: 'BLOB_CREATED' }
          : p
      ));
    } catch (error) {
      // Update state: error
      setPhotos(prev => prev.map(p =>
        p.checksum === hash
          ? { ...p, errorMessage: 'Failed to create blob', state: null }
          : p
      ));
    }
  }, [photos, handleSetPhotoState]);

  // ✅ Callback: Create attachment
  const handleCreateAttachment = useCallback(async (hash: string, attachableId: number) => {
    const photo = photos.find(p => p.checksum === hash);
    if (!photo?.blobId) return;

    try {
      // Update state: attaching
      handleSetPhotoState(hash, 'ATTACHING');

      // API call
      const { id: attachmentId } = await mockCreateAttachment(photo.blobId, attachableId);

      // Update state: attached
      setPhotos(prev => prev.map(p =>
        p.checksum === hash
          ? { ...p, attachmentId, state: 'ATTACHED' }
          : p
      ));
    } catch (error) {
      // Update state: error
      setPhotos(prev => prev.map(p =>
        p.checksum === hash
          ? { ...p, errorMessage: 'Failed to attach', state: null }
          : p
      ));
    }
  }, [photos, handleSetPhotoState]);

  // ✅ Callback: Get preview URL
  const handleGetPreviewUrl = useCallback(async (hash: string) => {
    const photo = photos.find(p => p.checksum === hash);
    if (!photo?.blobId) return;

    try {
      // API call
      const { previewUrl } = await mockGetPreviewUrl(photo.blobId);

      // Update state: preview URL set
      setPhotos(prev => prev.map(p =>
        p.checksum === hash
          ? { ...p, previewUrl }
          : p
      ));
    } catch (error) {
      // Update state: error
      setPhotos(prev => prev.map(p =>
        p.checksum === hash
          ? { ...p, errorMessage: 'Failed to get preview' }
          : p
      ));
    }
  }, [photos]);

  // ✅ Callback: Delete attachment
  const handleDeleteAttachment = useCallback(async (hash: string) => {
    const photo = photos.find(p => p.checksum === hash);
    if (!photo?.attachmentId) return;

    try {
      // Update state: detaching
      handleSetPhotoState(hash, 'DETACHING');

      // API call
      await mockDeleteAttachment(photo.attachmentId);

      // Update state: detached (remove from UI)
      handleSetPhotoState(hash, 'DETACHED');
    } catch (error) {
      // Update state: error
      setPhotos(prev => prev.map(p =>
        p.checksum === hash
          ? { ...p, errorMessage: 'Failed to delete', state: 'ATTACHED' }
          : p
      ));
    }
  }, [photos, handleSetPhotoState]);

  // ✅ Form submission
  const handleSubmit = async () => {
    // Check if all photos are synced
    const allSynced = photos.every(p => p.state === 'ATTACHED');
    
    if (!allSynced) {
      setSyncPhotos(true); // Trigger upload/delete cycle
      return;
    }

    // All synced, submit form
    setIsSaving(true);
    try {
      await fetch('/api/your-endpoint', {
        method: 'POST',
        body: JSON.stringify({
          photos: photos.map(p => ({ checksum: p.checksum, blobId: p.blobId })),
          mainPhotoHash,
        }),
      });
      alert('Saved successfully!');
    } catch (error) {
      alert('Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h1>Photo Upload Form (Local State Only)</h1>
      
      {/* ✅ ImageUploader with NO Redux */}
      <ImageUploader
        // State
        photos={photos}
        mainPhotoHash={mainPhotoHash}
        
        // State setters
        setMainPhotoHash={setMainPhotoHash}
        resetMainPhotoHash={() => setMainPhotoHash(null)}
        setPhotos={handleSetPhotos}
        setPhotoState={handleSetPhotoState}
        
        // Photo actions
        addPhoto={handleAddPhoto}
        removePhotoByHash={handleRemovePhoto}
        removePhotoByKey={handleRemovePhotoByKey}
        
        // Upload lifecycle
        getUploadUrl={handleGetUploadUrl}
        directUpload={handleDirectUpload}
        createBlob={handleCreateBlob}
        createAttachment={handleCreateAttachment}
        getPreviewUrl={handleGetPreviewUrl}
        deleteAttachment={handleDeleteAttachment}
        
        // Configuration
        isImmediateSyncMode={false}
        syncPhotos={syncPhotos}
        maxPhotos={10}
        attachableId={null}
        processRunning={isSaving}
      />

      {/* Submit button */}
      <button onClick={handleSubmit} disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save'}
      </button>

      {/* Debug info */}
      <pre style={{ fontSize: '10px', marginTop: '20px' }}>
        {JSON.stringify({ photos, mainPhotoHash }, null, 2)}
      </pre>
    </div>
  );
};

export default PhotoForm;

/**
 * ✅ Key Takeaways:
 * 
 * 1. NO Redux imports
 * 2. NO Zustand imports
 * 3. NO Context API
 * 4. Just useState + callbacks
 * 5. ImageUploader is completely state-agnostic
 * 6. Can be shipped as standalone library
 * 7. Works with ANY state management pattern
 */

