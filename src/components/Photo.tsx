import { Loader, X } from 'lucide-react';
import { PhotoType } from '../types/photo';
import { useEffect } from 'react';
interface PhotoProps {
  isImmediateSyncMode: boolean;
  photo: PhotoType;
  attachableId: number | null;
  file?: File;
  mainPhotoHash: string | null;
  setMainPhotoHash: (hash: string) => void;
  deleteFromFilesMap: (hash: string) => void;
  getUploadUrl: (hash: string) => void;
  getPreviewUrl: (hash: string) => void;
  directUpload: (hash: string, file: File) => void;
  createBlob: (hash: string) => void;
  createAttachment: (hash: string, attachableId: number) => void;
  removePhotoByHash: (hash: string) => void;
  deleteAttachment: (hash: string) => void;
  resetMainPhotoHash: () => void;
  setPhotoState: (hash: string, state: PhotoType['state']) => void;
  syncPhotos: boolean;
}

const Photo: React.FC<PhotoProps> = ({
  isImmediateSyncMode,
  attachableId,
  file,
  photo,
  mainPhotoHash,
  setMainPhotoHash,
  deleteFromFilesMap,
  getUploadUrl,
  getPreviewUrl,
  directUpload,
  createBlob,
  createAttachment,
  removePhotoByHash,
  deleteAttachment,
  resetMainPhotoHash,
  setPhotoState,
  syncPhotos,
}) => {
  const handleRemovePhoto = () => {
    if (photo.state === 'ATTACHED') {
      if (syncPhotos) {
        // If syncing, mark for detach to initiate the sync process
        setPhotoState(photo.checksum!, 'MARKED_FOR_DETACH');
      } else {
        // If not syncing, just mark it DETACHED to remove the photo from the UI
        setPhotoState(photo.checksum!, 'DETACHED');
      }
    } else {
      setPhotoState(photo.checksum!, 'DETACHED');
    }
  };
  const unlinkPhoto = () => {
    deleteFromFilesMap(photo.checksum!);
    removePhotoByHash(photo.checksum!);
    if (mainPhotoHash === photo.checksum) {
      resetMainPhotoHash();
    }
  };

  // upgrade photo life cycle instantly
  useEffect(() => {
    console.log('photo.state', photo.state);
    console.log('syncPhotos', syncPhotos);
    switch (photo.state) {
      case 'SELECTED_FOR_UPLOAD':
        if (syncPhotos) getUploadUrl(photo.checksum!);
        break;

      case 'UPLOADING_URL_GENERATED':
        if (file) directUpload(photo.checksum!, file);
        break;

      case 'UPLOADED':
        if (photo.key && photo.name) createBlob(photo.checksum!);
        break;

      case 'BLOB_CREATED':
        if (attachableId && photo.blobId)
          createAttachment(photo.checksum!, attachableId);
        break;

      case 'ATTACHED':
        if (!photo.previewUrl) getPreviewUrl(photo.checksum!);
        break;

      case 'DETACHED':
        unlinkPhoto();
        break;
      case 'MARKED_FOR_DETACH':
        if (syncPhotos) deleteAttachment(photo.checksum!);
        break;
      default:
        break;
    }
  }, [file, attachableId, syncPhotos, photo.state, photo.previewUrl]);
  console.log('photo.hash', photo.checksum);
  console.log('mainPhotoHash', mainPhotoHash);
  if (
    (!isImmediateSyncMode && photo.state === 'DETACHING') ||
    ['DETACHED', 'MARKED_FOR_DETACH'].includes(photo.state ?? '')
  ) {
    return null;
  }
  return (
    <div className='relative w-full h-full ' title={photo.name ?? ''}>
      <img
        src={photo.previewUrl!}
        alt={`${photo.name}`}
        className='object-cover w-full h-full'
      />
      {photo.state !== 'ATTACHED' &&
        syncPhotos &&
        (photo.state !== 'BLOB_CREATED' || attachableId) && (
          <div className='absolute inset-0 bg-black/20 flex items-center justify-center'>
            <Loader className='text-on-accent-primary animate-spin' />
          </div>
        )}

      {mainPhotoHash === photo.checksum && (
        <span className='absolute top-1 left-1 accent-primary text-on-accent-primary text-t4 px-1 py-0.5 rounded-full'>
          MAIN
        </span>
      )}
      {mainPhotoHash !== photo.checksum && (
        <button
          type='button'
          onClick={() => setMainPhotoHash(photo.checksum!)}
          className='absolute bottom-0 left-0 text-t4 px-2 py-0.5 rounded-full   
          translate-y-1/2
          bg-[var(--bg-primary-color)] 
          border-[var(--border-bg-primary-color)] border-1
          text-[var(--text-primary-color)]
          transition-colors duration-100
          hover:bg-[var(--bg-focused-color)] 
          hover:text-[var(--text-accent-primary-color)]  
          hover:border-[var(--border-bg-focused-color)]
          '
        >
          Set Main
        </button>
      )}
      <button
        type='button'
        onClick={() => handleRemovePhoto()}
        className='absolute top-0 right-0   -translate-y-1/2 translate-x-1/2
        bg-[var(--bg-primary-color)]
        text-[var(--text-primary-color)]
        border-[var(--border-bg-primary-color)] 
        hover:text-[var(--danger-primary)]  
        hover:bg-[var(--warning-primary)] 
        hover:border-[var(--border-warning-primary-color)]
         rounded-full p-0.5 cursor-pointer'
      >
        <X size={16} />
      </button>
    </div>
  );
};
export default Photo;
