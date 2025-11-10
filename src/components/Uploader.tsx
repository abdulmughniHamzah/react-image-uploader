import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { BlobType } from '../types/blob';
import { calculateChecksum } from '../utils/checksum';
import SortableBlob from './SortableBlob';
import { LoadedPropsType } from './propsType';
import { mergeStyling } from '../types/styling';

/**
 * Self-contained ImageUploader component with internal state management
 * 
 * ARCHITECTURE:
 * - Manages photo states internally
 * - Parent provides mutation callbacks (API calls)
 * - Parent reads final state via onPhotosChange callback
 * - syncPhotos controls whether to create attachments after blob creation
 */
export const Uploader = ({
  // New prop names (clear and explicit)
  instantUpload,
  instantSyncAttach = false,
  // Support both new and old prop names for backward compatibility
  maxBlobs,
  initialBlobs,
  onBlobsChange,
  attachableId,
  attachableType = 'Offer',
  processRunning = false,
  mainBlobHash: externalMainBlobHash,
  onMainBlobChange,
  mutations,
  styling: customStyling,
  
  // Legacy props (for backward compatibility)

}: LoadedPropsType) => {
  // Normalize props (new names take precedence, fall back to old names)
  const maxItems = maxBlobs ?? 10;
  const shouldUploadInstantly = instantUpload ?? true;
  const shouldAttachInstantly = instantSyncAttach ?? false;
  const initialItems = initialBlobs ?? [];
  const externalMain = externalMainBlobHash ?? null;
  const onItemsChange = onBlobsChange;
  const onMainChange = onMainBlobChange;
  
  // ===== INTERNAL STATE MANAGEMENT =====
  const [blobs, setBlobs] = useState<BlobType[]>(initialItems);
  const [filesMap, setFilesMap] = useState<Map<string, File>>(new Map());
  const [mainBlobHash, setMainBlobHash] = useState<string | null>(externalMain);

  // Merge styling with defaults
  const styling = useMemo(() => mergeStyling(customStyling), [customStyling]);

  // ===== SYNC WITH PARENT =====
  useEffect(() => {
    onItemsChange?.(blobs);
  }, [blobs, onItemsChange]);

  useEffect(() => {
    onMainChange?.(mainBlobHash);
  }, [mainBlobHash, onMainChange]);

  // ===== BLOB STATE MANAGEMENT =====
  const updateBlobState = useCallback((checksum: string, updates: Partial<BlobType>) => {
    setBlobs(prev => prev.map(p =>
      p.checksum === checksum ? { ...p, ...updates } : p
    ));
  }, []);

  const addBlob = useCallback((blob: BlobType) => {
    setBlobs(prev => [...prev, blob]);
  }, []);

  const removeBlobByHash = useCallback((checksum: string) => {
    setBlobs(prev => prev.filter(p => p.checksum !== checksum));
    if (mainBlobHash === checksum) {
      setMainBlobHash(null);
    }
  }, [mainBlobHash]);

  // ===== FILE HANDLING =====
  const deleteFromFilesMap = useCallback((checksum: string) => {
    setFilesMap(prev => {
      const newMap = new Map(prev);
      newMap.delete(checksum);
      return newMap;
    });
  }, []);

  const handleFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList) return;
    const files: File[] = Array.from(fileList);
    const validFiles: File[] = files.slice(0, maxItems - blobs.length);

    for (const file of validFiles) {
      const checksum = await calculateChecksum(file);

      if (blobs.some((blob) => blob.checksum === checksum)) {
        continue;
      }

      setFilesMap(prev => {
        const newMap = new Map(prev);
        newMap.set(checksum, file);
        return newMap;
      });

      const newBlob: BlobType = {
        attachmentId: null,
        blobId: null,
        key: null,
        previewUrl: URL.createObjectURL(file),
        name: file.name,
        uploadUrl: null,
        mimeType: file.type,
        size: file.size,
        checksum: checksum,
        state: 'SELECTED_FOR_UPLOAD',
        errorMessage: null,
        url: null,
      };
      addBlob(newBlob);
    }
  }, [maxItems, blobs, addBlob]);

  // ===== MUTATION WRAPPERS (Internal state management) =====
  const wrappedGetUploadUrl = useCallback(async (checksum: string) => {
    const blob = blobs.find(p => p.checksum === checksum);
    if (!blob) return;

    try {
      updateBlobState(checksum, { state: 'UPLOADING_URL_GENERATING' });
      
      const result = await mutations.getUploadUrl({
        hash: checksum,
        name: blob.name!,
        mimeType: blob.mimeType!,
        size: blob.size!,
      });

      if (result.success) {
        updateBlobState(checksum, {
          uploadUrl: result.uploadUrl,
          key: result.key,
          state: 'UPLOADING_URL_GENERATED',
        });
      } else {
        updateBlobState(checksum, {
          errorMessage: result.error,
          state: 'SELECTED_FOR_UPLOAD',
        });
      }
    } catch (error: any) {
      updateBlobState(checksum, {
        errorMessage: error.message || 'Failed to get upload URL',
        state: 'SELECTED_FOR_UPLOAD',
      });
    }
  }, [blobs, mutations, updateBlobState]);

  const wrappedDirectUpload = useCallback(async (checksum: string, file: File) => {
    const blob = blobs.find(p => p.checksum === checksum);
    if (!blob || !blob.uploadUrl) return;

    try {
      updateBlobState(checksum, { state: 'UPLOADING' });
      
      const result = await mutations.directUpload({
        hash: checksum,
        uploadUrl: blob.uploadUrl,
        file,
      });

      if (result.success) {
        updateBlobState(checksum, { state: 'UPLOADED' });
      } else {
        updateBlobState(checksum, {
          errorMessage: result.error,
          state: 'UPLOADING_URL_GENERATED',
        });
      }
    } catch (error: any) {
      updateBlobState(checksum, {
        errorMessage: error.message || 'Failed to upload file',
        state: 'UPLOADING_URL_GENERATED',
      });
    }
  }, [blobs, mutations, updateBlobState]);

  const wrappedCreateBlob = useCallback(async (checksum: string) => {
    const blob = blobs.find(p => p.checksum === checksum);
    if (!blob || !blob.key) return;

    try {
      updateBlobState(checksum, { state: 'BLOB_CREATING' });
      
      const result = await mutations.createBlob({
        hash: checksum,
        key: blob.key,
        name: blob.name!,
        mimeType: blob.mimeType!,
        size: blob.size!,
      });

      if (result.success) {
        updateBlobState(checksum, {
          blobId: result.id,
          state: 'BLOB_CREATED',
        });
      } else {
        updateBlobState(checksum, {
          errorMessage: result.error,
          state: 'UPLOADED',
        });
      }
    } catch (error: any) {
      updateBlobState(checksum, {
        errorMessage: error.message || 'Failed to create blob',
        state: 'UPLOADED',
      });
    }
  }, [blobs, mutations, updateBlobState]);

  const wrappedCreateAttachment = useCallback(async (checksum: string, attId: number) => {
    const blob = blobs.find(p => p.checksum === checksum);
    if (!blob || !blob.blobId) return;

    try {
      updateBlobState(checksum, { state: 'ATTACHING' });
      
      const result = await mutations.createAttachment({
        hash: checksum,
        blobId: blob.blobId,
        attachableId: attId,
        attachableType,
      });

      if (result.success) {
        updateBlobState(checksum, {
          attachmentId: result.id,
          state: 'ATTACHED',
        });
      } else {
        updateBlobState(checksum, {
          errorMessage: result.error,
          state: 'BLOB_CREATED',
        });
      }
    } catch (error: any) {
      updateBlobState(checksum, {
        errorMessage: error.message || 'Failed to create attachment',
        state: 'BLOB_CREATED', // Allow retry
      });
    }
  }, [blobs, mutations, attachableType, updateBlobState]);

  const wrappedDeleteAttachment = useCallback(async (checksum: string) => {
    const blob = blobs.find(p => p.checksum === checksum);
    if (!blob || !blob.attachmentId) return;

    try {
      updateBlobState(checksum, { state: 'DETACHING' });
      
      const result = await mutations.deleteAttachment({
        hash: checksum,
        attachmentId: blob.attachmentId,
      });

      if (result.success) {
        updateBlobState(checksum, { state: 'DETACHED' });
      } else {
        updateBlobState(checksum, {
          errorMessage: result.error,
          state: 'ATTACHED',
        });
      }
    } catch (error: any) {
      updateBlobState(checksum, {
        errorMessage: error.message || 'Failed to delete attachment',
        state: 'ATTACHED',
      });
    }
  }, [blobs, mutations, updateBlobState]);

  const wrappedGetPreviewUrl = useCallback(async (checksum: string) => {
    const blob = blobs.find(p => p.checksum === checksum);
    if (!blob || !blob.key) return;

    try {
      const result = await mutations.getPreviewUrl({
        hash: checksum,
        key: blob.key,
      });
      if (result.success) {
        updateBlobState(checksum, { previewUrl: result.previewUrl });
      }
    } catch (error: any) {
      console.error('Failed to get preview URL:', error);
    }
  }, [blobs, mutations, updateBlobState]);

  // ===== STATE SETTERS (Framework-agnostic) =====
  const stateSetters = useMemo(() => ({
    setBlobState: (hash: string, state: BlobType['state']) => {
      updateBlobState(hash, { state });
    },
    setBlobUploadUrl: (hash: string, uploadUrl: string) => {
      updateBlobState(hash, { uploadUrl });
    },
    setBlobKey: (hash: string, key: string) => {
      updateBlobState(hash, { key });
    },
    setBlobId: (hash: string, blobId: number) => {
      updateBlobState(hash, { blobId });
    },
    setBlobPreviewUrl: (hash: string, previewUrl: string | null) => {
      updateBlobState(hash, { previewUrl });
    },
    setBlobUrl: (hash: string, url: string | null) => {
      updateBlobState(hash, { url });
    },
    setBlobAttachmentId: (hash: string, attachmentId: number) => {
      updateBlobState(hash, { attachmentId });
    },
    setBlobErrorMessage: (hash: string, errorMessage: string | null) => {
      updateBlobState(hash, { errorMessage });
    },
  }), [updateBlobState]);

  // ===== DRAG AND DROP =====
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragEnd = useCallback((event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setBlobs(prev => {
        const oldIndex = prev.findIndex((p) => p.checksum === active.id);
        const newIndex = prev.findIndex((p) => p.checksum === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }, []);

  const handleSetMainBlobHash = useCallback((checksum: string) => {
    setMainBlobHash(checksum);
  }, []);

  const handleResetMainBlobHash = useCallback(() => {
    setMainBlobHash(null);
  }, []);

  // ===== RENDER =====
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={blobs.map((blob) => blob.checksum ?? '')}
        strategy={rectSortingStrategy}
      >
        <div className={styling.containerClassName}>
          {blobs.length < maxItems && !processRunning && (
            <label
              title='Upload File'
              className={styling.uploadButtonClassName}
            >
              <span className='text-center'>Upload</span>
              <input
                type='file'
                accept='image/*'
                multiple
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFiles(e.target.files);
                    e.target.value = '';
                  }
                }}
                onClick={(e) => {
                  (e.target as HTMLInputElement).value = '';
                }}
                className='hidden'
              />
            </label>
          )}
          {blobs
            .filter((blob) => blob.checksum)
            .map((blob) => (
              <SortableBlob
                key={blob.checksum ?? ''}
                id={blob.checksum ?? ''}
                blob={blob}
                filesMap={filesMap}
                instantUpload={shouldUploadInstantly}
                instantSyncAttach={shouldAttachInstantly}
                attachableId={attachableId}
                attachableType={attachableType}
                mainBlobHash={mainBlobHash}
                setMainBlobHash={handleSetMainBlobHash}
                deleteFromFilesMap={deleteFromFilesMap}
                removeBlobByHash={removeBlobByHash}
                resetMainBlobHash={handleResetMainBlobHash}
                mutations={mutations}
                stateSetters={stateSetters}
                styling={styling}
              />
            ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default Uploader;

