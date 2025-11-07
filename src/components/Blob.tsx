import { Loader, X } from 'lucide-react';
import { BlobType } from '../types/blob';
import { StylingProps } from '../types/styling';
import { MutationCallbacks } from '../types/mutations';
import { useEffect } from 'react';

/**
 * Individual state setters - makes the component completely framework-agnostic
 * The parent controls how state is stored (Redux, Zustand, useState, etc.)
 */
export interface BlobStateSetters {
  setBlobState: (hash: string, state: BlobType['state']) => void;
  setBlobUploadUrl: (hash: string, uploadUrl: string) => void;
  setBlobKey: (hash: string, key: string) => void;
  setBlobId: (hash: string, blobId: number) => void;
  setBlobPreviewUrl: (hash: string, previewUrl: string) => void;
  setBlobAttachmentId: (hash: string, attachmentId: number) => void;
  setBlobErrorMessage: (hash: string, errorMessage: string | null) => void;
}

interface BlobProps {
  isImmediateSyncMode: boolean;
  blob: BlobType;
  attachableId: number | null;
  attachableType: string;
  file?: File;
  mainBlobHash: string | null;
  setMainBlobHash: (hash: string) => void;
  deleteFromFilesMap: (hash: string) => void;
  removeBlobByHash: (hash: string) => void;
  resetMainBlobHash: () => void;
  syncBlobs: boolean;
  mutations: MutationCallbacks;
  stateSetters: BlobStateSetters;
  styling: Required<StylingProps>;
}

const Blob: React.FC<BlobProps> = ({
  isImmediateSyncMode,
  attachableId,
  attachableType,
  file,
  blob,
  mainBlobHash,
  setMainBlobHash,
  deleteFromFilesMap,
  removeBlobByHash,
  resetMainBlobHash,
  syncBlobs,
  mutations,
  stateSetters,
  styling,
}) => {
  const handleRemoveBlob = () => {
    if (blob.state === 'ATTACHED') {
      if (syncBlobs) {
        // If syncing, mark for detach to initiate the sync process
        stateSetters.setBlobState(blob.checksum!, 'MARKED_FOR_DETACH');
      } else {
        // If not syncing, just mark it DETACHED to remove the blob from the UI
        stateSetters.setBlobState(blob.checksum!, 'DETACHED');
      }
    } else {
      stateSetters.setBlobState(blob.checksum!, 'DETACHED');
    }
  };

  const unlinkBlob = () => {
    deleteFromFilesMap(blob.checksum!);
    removeBlobByHash(blob.checksum!);
    if (mainBlobHash === blob.checksum) {
      resetMainBlobHash();
    }
  };

  // Blob lifecycle state machine with local state control
  // Component is now completely agnostic - it just orchestrates and calls individual setters
  useEffect(() => {
    const handleStateTransition = async () => {
      if (!blob.checksum) return;
      
      const hash = blob.checksum;
      
      switch (blob.state) {
        case 'SELECTED_FOR_UPLOAD':
          // Only start upload if syncBlobs is true
          if (syncBlobs && blob.name && blob.mimeType && blob.size) {
            stateSetters.setBlobState(hash, 'UPLOADING_URL_GENERATING');
            
            const result = await mutations.getUploadUrl({
              hash,
              name: blob.name,
              mimeType: blob.mimeType,
              size: blob.size,
            });
            
            if (result.success) {
              stateSetters.setBlobUploadUrl(result.hash, result.uploadUrl);
              stateSetters.setBlobKey(result.hash, result.key);
              stateSetters.setBlobErrorMessage(result.hash, null);
              stateSetters.setBlobState(result.hash, 'UPLOADING_URL_GENERATED');
            } else {
              stateSetters.setBlobErrorMessage(result.hash, result.error);
              stateSetters.setBlobState(result.hash, 'SELECTED_FOR_UPLOAD');
            }
          }
          break;

        case 'UPLOADING_URL_GENERATED':
          if (file && blob.uploadUrl) {
            stateSetters.setBlobState(hash, 'UPLOADING');
            
            const result = await mutations.directUpload({
              hash,
              uploadUrl: blob.uploadUrl,
              file,
            });
            
            if (result.success) {
              stateSetters.setBlobErrorMessage(result.hash, null);
              stateSetters.setBlobState(result.hash, 'UPLOADED');
            } else {
              stateSetters.setBlobErrorMessage(result.hash, result.error);
              stateSetters.setBlobState(result.hash, 'UPLOADING_URL_GENERATED');
            }
          }
          break;

        case 'UPLOADED':
          if (blob.key && blob.name && blob.mimeType && blob.size) {
            stateSetters.setBlobState(hash, 'BLOB_CREATING');
            
            const result = await mutations.createBlob({
              hash,
              key: blob.key,
              name: blob.name,
              mimeType: blob.mimeType,
              size: blob.size,
            });
            
            if (result.success) {
              stateSetters.setBlobId(result.hash, result.id);
              stateSetters.setBlobKey(result.hash, result.key);
              stateSetters.setBlobPreviewUrl(result.hash, result.url);
              stateSetters.setBlobErrorMessage(result.hash, null);
              stateSetters.setBlobState(result.hash, 'BLOB_CREATED');
            } else {
              stateSetters.setBlobErrorMessage(result.hash, result.error);
              stateSetters.setBlobState(result.hash, 'UPLOADED');
            }
          }
          break;

        case 'BLOB_CREATED':
          // Only create attachment when isImmediateSyncMode is true and we have required data
          if (isImmediateSyncMode && attachableId && blob.blobId && !blob.errorMessage) {
            stateSetters.setBlobState(hash, 'ATTACHING');
            
            const result = await mutations.createAttachment({
              hash,
              blobId: blob.blobId,
              attachableId,
              attachableType,
            });
            
            if (result.success) {
              stateSetters.setBlobAttachmentId(result.hash, result.id);
              stateSetters.setBlobErrorMessage(result.hash, null);
              stateSetters.setBlobState(result.hash, 'ATTACHED');
            } else {
              stateSetters.setBlobErrorMessage(result.hash, result.error);
              stateSetters.setBlobState(result.hash, 'BLOB_CREATED');
            }
          }
          break;

        case 'ATTACHED':
          // Preview URL is already set from createBlob response
          // This case is mainly for rendering the completed state
          break;

        case 'DETACHED':
          unlinkBlob();
          break;

        case 'MARKED_FOR_DETACH':
          if (syncBlobs && blob.attachmentId) {
            stateSetters.setBlobState(hash, 'DETACHING');
            
            const result = await mutations.deleteAttachment({
              hash,
              attachmentId: blob.attachmentId,
            });
            
            if (result.success) {
              stateSetters.setBlobErrorMessage(result.hash, null);
              stateSetters.setBlobState(result.hash, 'DETACHED');
            } else {
              stateSetters.setBlobErrorMessage(result.hash, result.error);
              stateSetters.setBlobState(result.hash, 'MARKED_FOR_DETACH');
            }
          }
          break;

        default:
          break;
      }
    };

    handleStateTransition();
  }, [
    file,
    attachableId,
    attachableType,
    syncBlobs,
    isImmediateSyncMode,
    blob.state,
    blob.checksum,
    blob.errorMessage,
    stateSetters,
    mutations,
  ]);

  // Don't render blobs that are being detached or detached
  if (
    (!syncBlobs && blob.state === 'DETACHING') ||
    ['DETACHED', 'MARKED_FOR_DETACH'].includes(blob.state ?? '')
  ) {
    return null;
  }

  return (
    <div className={styling.photoContainerClassName} title={blob.name ?? ''}>
      <img
        src={blob.previewUrl!}
        alt={`${blob.name}`}
        className={styling.photoImageClassName}
      />

      {/* Loading spinner - shows when blob is in progress */}
      {blob.state !== 'ATTACHED' &&
        syncBlobs &&
        (blob.state !== 'BLOB_CREATED' || attachableId) && (
          <div className={styling.loadingClassName}>
            <Loader className='text-white animate-spin w-8 h-8' />
          </div>
        )}

      {/* Error message */}
      {blob.errorMessage && (
        <div className={styling.errorClassName}>
          {blob.errorMessage}
        </div>
      )}

      {/* Remove button */}
      <button
        type='button'
        onClick={handleRemoveBlob}
        className={styling.removeButtonClassName}
        title='Remove blob'
      >
        <X className='w-4 h-4' />
      </button>

      {/* Main blob badge */}
      {mainBlobHash === blob.checksum && (
        <div className={styling.mainPhotoBadgeClassName}>
          Main
        </div>
      )}

      {/* Set as main blob button */}
      {mainBlobHash !== blob.checksum && blob.state === 'ATTACHED' && (
        <button
          type='button'
          onClick={() => setMainBlobHash(blob.checksum!)}
          className={`
            absolute bottom-1 left-1
            px-2 py-0.5
            text-xs font-medium
            bg-white bg-opacity-80 hover:bg-opacity-100
            text-gray-700
            rounded
            cursor-pointer
            transition-all
            z-10
          `.replace(/\s+/g, ' ').trim()}
          title='Set as main blob'
        >
          Set Main
        </button>
      )}
    </div>
  );
};

export default Blob;

