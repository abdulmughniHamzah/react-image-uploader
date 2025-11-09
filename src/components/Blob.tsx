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
  setBlobPreviewUrl: (hash: string, previewUrl: string | null) => void;
  setBlobUrl: (hash: string, url: string | null) => void;
  setBlobAttachmentId: (hash: string, attachmentId: number) => void;
  setBlobErrorMessage: (hash: string, errorMessage: string | null) => void;
}

interface BlobProps {
  instantUpload: boolean;
  instantSyncAttach: boolean;
  blob: BlobType;
  attachableId: number | null;
  attachableType: string;
  file?: File;
  mainBlobHash: string | null;
  setMainBlobHash: (hash: string) => void;
  deleteFromFilesMap: (hash: string) => void;
  removeBlobByHash: (hash: string) => void;
  resetMainBlobHash: () => void;
  mutations: MutationCallbacks;
  stateSetters: BlobStateSetters;
  styling: Required<StylingProps>;
}

const Blob: React.FC<BlobProps> = ({
  instantUpload,
  instantSyncAttach,
  attachableId,
  attachableType,
  file,
  blob,
  mainBlobHash,
  setMainBlobHash,
  deleteFromFilesMap,
  removeBlobByHash,
  resetMainBlobHash,
  mutations,
  stateSetters,
  styling,
}) => {
  const handleRemoveBlob = () => {
    if (blob.state === 'ATTACHED') {
      if (instantUpload) {
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

  const handleRetry = () => {
    if (!blob.checksum) return;

    // Map failed states to their retry states
    switch (blob.state) {
      case 'UPLOADING_URL_GENERATION_FAILED':
        stateSetters.setBlobState(blob.checksum, 'SELECTED_FOR_UPLOAD');
        break;
      case 'UPLOAD_FAILED':
        stateSetters.setBlobState(blob.checksum, 'UPLOADING_URL_GENERATED');
        break;
      case 'BLOB_CREATION_FAILED':
        stateSetters.setBlobState(blob.checksum, 'UPLOADED');
        break;
      case 'ATTACHMENT_FAILED':
        stateSetters.setBlobState(blob.checksum, 'BLOB_CREATED');
        break;
      case 'DETACHMENT_FAILED':
        stateSetters.setBlobState(blob.checksum, 'MARKED_FOR_DETACH');
        break;
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
          // Only start upload if instantUpload is true
          if (instantUpload && blob.name && blob.mimeType && blob.size) {
            stateSetters.setBlobState(hash, 'UPLOADING_URL_GENERATING');
            
            const result = await mutations.getUploadUrl({
              hash,
              name: blob.name,
              mimeType: blob.mimeType,
              size: blob.size,
            });
            
            if (result.success) {
              if(result.uploadUrl){
                stateSetters.setBlobUploadUrl(hash, result.uploadUrl);
                stateSetters.setBlobKey(hash, result.key);
                stateSetters.setBlobErrorMessage(hash, null);
                stateSetters.setBlobState(hash, 'UPLOADING_URL_GENERATED');
              } else if(result.blobId && result.key){
                stateSetters.setBlobId(hash, result.blobId);
                stateSetters.setBlobKey(hash, result.key);
                stateSetters.setBlobPreviewUrl(hash, result.previewUrl);
                stateSetters.setBlobUrl(hash, result.url);
                stateSetters.setBlobErrorMessage(hash, null);
                stateSetters.setBlobState(hash, 'BLOB_CREATED');
              } else {
                stateSetters.setBlobErrorMessage(hash, null);
                stateSetters.setBlobState(hash, 'UPLOADED');
              }
            } else {
              stateSetters.setBlobErrorMessage(hash, result.error);
              stateSetters.setBlobState(hash, 'UPLOADING_URL_GENERATION_FAILED');
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
              stateSetters.setBlobErrorMessage(hash, null);
              stateSetters.setBlobState(hash, 'UPLOADED');
            } else {
              stateSetters.setBlobErrorMessage(hash, result.error);
              stateSetters.setBlobState(hash, 'UPLOAD_FAILED');
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
              stateSetters.setBlobId(hash, result.id);
              stateSetters.setBlobKey(hash, result.key);
              stateSetters.setBlobPreviewUrl(hash, result.previewUrl);
              stateSetters.setBlobUrl(hash, result.url);
              stateSetters.setBlobErrorMessage(hash, null);
              stateSetters.setBlobState(hash, 'BLOB_CREATED');
            } else {
              stateSetters.setBlobErrorMessage(hash, result.error);
              stateSetters.setBlobState(hash, 'BLOB_CREATION_FAILED');
            }
          }
          break;

        case 'BLOB_CREATED':
          // Only create attachment when instantSyncAttach is true and we have required data
          if (instantSyncAttach && attachableId && blob.blobId && !blob.errorMessage) {
            stateSetters.setBlobState(hash, 'ATTACHING');
            
            const result = await mutations.createAttachment({
              hash,
              blobId: blob.blobId,
              attachableId,
              attachableType,
            });
            
            if (result.success) {
              stateSetters.setBlobAttachmentId(hash, result.id);
              stateSetters.setBlobErrorMessage(hash, null);
              stateSetters.setBlobState(hash, 'ATTACHED');
            } else {
              stateSetters.setBlobErrorMessage(hash, result.error);
              stateSetters.setBlobState(hash, 'ATTACHMENT_FAILED');
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
          if (instantUpload && blob.attachmentId) {
            stateSetters.setBlobState(hash, 'DETACHING');
            try {
              await mutations.deleteAttachment({
                hash,
                attachmentId: blob.attachmentId,
              });
              stateSetters.setBlobErrorMessage(hash, null);
              stateSetters.setBlobState(hash, 'DETACHED');
            } catch (error) {
              const message =
                error instanceof Error ? error.message : 'Failed to detach blob';
              stateSetters.setBlobErrorMessage(hash, message);
              stateSetters.setBlobState(hash, 'DETACHMENT_FAILED');
            }
          }
          break;

        default:
          break;
      }
    };
    console.log('====>blob:', blob);
    handleStateTransition();
  }, [
    file,
    attachableId,
    attachableType,
    instantUpload,
    instantSyncAttach,
    blob.state,
    blob.checksum,
    blob.errorMessage,
    stateSetters,
    mutations,
  ]);

  // Don't render blobs that are being detached or detached
  if (
    (!instantUpload && blob.state === 'DETACHING') ||
    ['DETACHED', 'MARKED_FOR_DETACH'].includes(blob.state ?? '')
  ) {
    return null;
  }

  // Check if blob is in a failed state
  const isInFailedState = [
    'UPLOADING_URL_GENERATION_FAILED',
    'UPLOAD_FAILED',
    'BLOB_CREATION_FAILED',
    'ATTACHMENT_FAILED',
    'DETACHMENT_FAILED',
  ].includes(blob.state ?? '');

  return (
    <div 
      className={`${styling.blobContainerClassName} ${isInFailedState ? styling.blobContainerFailedClassName : ''}`}
      title={blob.name ?? ''}
    >
      <img
        src={blob.previewUrl!}
        alt={`${blob.name}`}
        className={`${styling.blobImageClassName} ${isInFailedState ? styling.blobImageFailedClassName : ''}`}
      />

      {/* Loading spinner - shows when blob is in progress (but not in failed state) */}
      {!isInFailedState &&
        blob.state !== 'ATTACHED' &&
        instantUpload &&
        (blob.state !== 'BLOB_CREATED' || attachableId) && (
          <div className={styling.loadingContainerClassName}>
            <Loader className={styling.loadingSpinnerClassName} />
          </div>
        )}

      {/* Error message with retry button */}
      {blob.errorMessage && (
        <div className={styling.errorContainerClassName}>
          <div className={styling.errorMessageClassName}>{blob.errorMessage}</div>
          {isInFailedState && (
            <button
              type='button'
              onClick={handleRetry}
              className={styling.retryButtonClassName}
              title="Retry upload"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Remove button */}
      <button
        type='button'
        onClick={handleRemoveBlob}
        className={styling.removeButtonClassName}
        title='Remove blob'
      >
        <X className={styling.removeButtonIconClassName} />
      </button>

      {/* Main blob badge */}
      {mainBlobHash === blob.checksum && (
        <div className={styling.mainBlobBadgeClassName}>
          Main
        </div>
      )}

      {/* Set as main blob button */}
      {mainBlobHash !== blob.checksum && blob.state === 'ATTACHED' && (
        <button
          type='button'
          onClick={() => setMainBlobHash(blob.checksum!)}
          className={styling.setMainButtonClassName}
          title='Set as main blob'
        >
          Set Main
        </button>
      )}
    </div>
  );
};

export default Blob;

