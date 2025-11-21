import React, { useEffect, useCallback, useMemo, useRef } from 'react';
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


const BlobUploader = ({
  instantUpload,
  instantSyncAttach = false,
  maxBlobs,
  blobs,
  setBlobs,
  attachableId,
  attachableType = 'Offer',
  processRunning = false,
  maxRetries = 3,
  mainBlobHash: externalMainBlobHash,
  onMainBlobChange,
  mutations,
  styling: customStyling,
}: LoadedPropsType) => {
  const maxItems = maxBlobs ?? 10;
  const shouldUploadInstantly = instantUpload ?? true;
  const shouldAttachInstantly = instantSyncAttach ?? false;
  const mainBlobHash = externalMainBlobHash ?? null;

  const onMainChange = onMainBlobChange;

  const filesMapRef = useRef<Map<string, File>>(new Map());

  const blobsRef = useRef<BlobType[]>(blobs);
  useEffect(() => {
    blobsRef.current = blobs;
  }, [blobs]);
 
  const styling = useMemo(() => mergeStyling(customStyling), [customStyling]);

  useEffect(() => {
    onMainChange?.(mainBlobHash);
  }, [mainBlobHash, onMainChange]);

  const deleteFromFilesMap = useCallback((checksum: string) => {
    filesMapRef.current.delete(checksum);
  }, []);

  const setBlob = useCallback(
    (hash: string, updates: Partial<BlobType>) => {
      const current = blobsRef.current;
      const next = current.map((p) =>
        p.checksum === hash ? { ...p, ...updates } : p
      );
      blobsRef.current = next;
      setBlobs(next);
    },
    [setBlobs]
  );

  const addBlob = useCallback(
    (blob: BlobType) => {
      const current = blobsRef.current;
      const next = [...current, blob];
      blobsRef.current = next;
      setBlobs(next);
    },
    [setBlobs]
  );

  const removeBlobByHash = useCallback(
    (checksum: string) => {
      const current = blobsRef.current;
      const next = current.filter((p) => p.checksum !== checksum);
      blobsRef.current = next;
      setBlobs(next);
      if (mainBlobHash === checksum) {
        onMainChange?.(null);
      }
    },
    [mainBlobHash, onMainChange, setBlobs]
  );

  const handleFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList) return;
    const current = blobsRef.current;
    const files: File[] = Array.from(fileList);
    const validFiles: File[] = files.slice(0, Math.max(maxItems - current.length, 0));

    for (const file of validFiles) {
      const checksum = await calculateChecksum(file);

      if (current.some((blob) => blob.checksum === checksum)) {
        continue;
      }

      filesMapRef.current.set(checksum, file);

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
        retryCount: maxRetries, // Initialize with configurable retries
      };
      addBlob(newBlob);
    }
  }, [maxItems, maxRetries, addBlob]);

  const stateSetters = useMemo(
    () => ({
      setBlob,
    }),
    [setBlob]
  );

  
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
    if (!over || active.id === over.id) return;


    const current = blobsRef.current;
    const oldIndex = current.findIndex((p) => p.checksum === active.id);
    const newIndex = current.findIndex((p) => p.checksum === over.id);

    if (oldIndex >= 0 && newIndex >= 0) {
      const next = arrayMove(current, oldIndex, newIndex);
      blobsRef.current = next;
      setBlobs(next);
    }
  }, [setBlobs]);

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
                instantUpload={shouldUploadInstantly}
                instantSyncAttach={shouldAttachInstantly}
                attachableId={attachableId}
                attachableType={attachableType}
                mainBlobHash={mainBlobHash}
                setMainBlobHash={(checksum) => onMainChange?.(checksum)}
                deleteFromFilesMap={deleteFromFilesMap}
                removeBlobByHash={removeBlobByHash}
                resetMainBlobHash={() => onMainChange?.(null)}
                mutations={mutations}
                stateSetters={stateSetters}
                styling={styling}
                processRunning={processRunning}
                filesMap={filesMapRef.current} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    );
  };

export default BlobUploader;
