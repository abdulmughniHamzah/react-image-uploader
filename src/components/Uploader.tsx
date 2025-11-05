import React, { useState } from 'react';
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
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PhotoType } from '../types/photo';
import { calculateChecksum } from '../utils/checksum';
import SortablePhoto from './SortablePhoto';
import { LoadedPropsType } from './propsType';

export const Uploader = ({
  isImmediateSyncMode,
  maxPhotos = 10,
  syncPhotos,
  photos,
  attachableId,
  processRunning,
  addPhoto,
  setMainPhotoHash,
  mainPhotoHash,
  removePhotoByHash,
  getUploadUrl,
  getPreviewUrl,
  directUpload,
  createBlob,
  createAttachment,
  deleteAttachment,
  resetMainPhotoHash,
  setPhotoState,
  setPhotos,
}: LoadedPropsType) => {
  const [filesMap, setFilesMap] = useState<Map<string, File>>(new Map());
  const deleteFromFilesMap = (hash: string) => {
    const checksum = photos.find((photo) => photo.checksum === hash)?.checksum;
    if (!checksum) return;

    setFilesMap((prevMap) => {
      const newMap = new Map(prevMap);
      newMap.delete(checksum);
      return newMap;
    });
  };
  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList) return;
    const files: File[] = Array.from(fileList);
    const validFiles: File[] = files.slice(0, maxPhotos - photos.length);

    for (const file of validFiles) {
      const checksum = await calculateChecksum(file);

      if (photos.some((photo) => photo.checksum === checksum)) {
        continue;
      }

      setFilesMap((prevMap) => {
        const newMap = new Map(prevMap);
        newMap.set(checksum, file);
        return newMap;
      });

      const newItem: PhotoType = {
        attachmentId: null,
        blobId: null,
        key: null,
        previewUrl: URL.createObjectURL(file ?? new File([], '')),
        name: file.name,
        uploadUrl: null,
        mimeType: file.type,
        size: file.size,
        checksum: checksum,
        state: 'SELECTED_FOR_UPLOAD',
        errorMessage: null,
      };
      addPhoto(newItem);
    }
  };

  // dnd-kit setup
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = photos.findIndex((p) => p.checksum === active.id);
      const newIndex = photos.findIndex((p) => p.checksum === over.id);
      setPhotos(arrayMove(photos, oldIndex, newIndex));
    }
  };
  // grid-cols-[repeat(auto-fit,_minmax(140px,_1fr))]

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={photos.map((photo) => photo.checksum ?? '')}
        strategy={rectSortingStrategy}
      >
        <div className='flex flex-wrap justify-start items-stretch gap-x-2 gap-y-4  lg:gap-x-4 lg:gap-y-6 rounded-lg  rounded-none '>
          {photos.length < maxPhotos && (
            <label
              title='Upload Image'
              className='w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] md:w-[120px] md:h-[120px] lg:w-[140px] lg:h-[140px]
                text-secondary font-medium text-t2 
                flex items-center justify-center
                border border-dashed border-bg-primary  
                rounded-[4px] 
                cursor-pointer 
                bg-primary hover:!bg-[var(--bg-focused-color)] 
                hover:!text-[var(--text-accent-primary-color)] hover:!border-[var(--border-accent-primary-color)] 
                transition-colors duration-100'
            >
              <span className='  text-center'>Upload</span>
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
          {photos
            .filter((photo) => photo.checksum)
            .map((photo) => (
              <SortablePhoto
                key={photo.checksum ?? ''}
                id={photo.checksum ?? ''}
                photo={photo}
                filesMap={filesMap}
                isImmediateSyncMode={isImmediateSyncMode}
                attachableId={attachableId}
                mainPhotoHash={mainPhotoHash}
                setMainPhotoHash={setMainPhotoHash}
                deleteAttachment={deleteAttachment}
                deleteFromFilesMap={deleteFromFilesMap}
                removePhotoByHash={removePhotoByHash}
                getUploadUrl={getUploadUrl}
                getPreviewUrl={getPreviewUrl}
                directUpload={directUpload}
                createBlob={createBlob}
                createAttachment={createAttachment}
                resetMainPhotoHash={resetMainPhotoHash}
                syncPhotos={syncPhotos}
                setPhotoState={setPhotoState}
              />
            ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default Uploader;
