import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Photo from './Photo';

function SortablePhoto({
  id,
  photo,
  filesMap,
  isImmediateSyncMode,
  attachableId,
  mainPhotoHash,
  setMainPhotoHash,
  deleteAttachment,
  deleteFromFilesMap,
  removePhotoByHash,
  getUploadUrl,
  getPreviewUrl,
  directUpload,
  createBlob,
  createAttachment,
  resetMainPhotoHash,
  syncPhotos,
  setPhotoState,
}: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 999 : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className='w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] md:w-[120px] md:h-[120px] lg:w-[140px] lg:h-[140px]'
    >
      <Photo
        isImmediateSyncMode={isImmediateSyncMode}
        attachableId={attachableId}
        file={filesMap.get(photo.checksum ?? '')}
        photo={photo}
        mainPhotoHash={mainPhotoHash ?? null}
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
    </div>
  );
}

export default SortablePhoto;
