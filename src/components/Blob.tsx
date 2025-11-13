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
  setBlob: (hash: string, updates: Partial<BlobType>) => void;
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
  processRunning: boolean;
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
  processRunning,
}) => {
  const setBlob = stateSetters.setBlob;

  const handleRemoveBlob = () => {
    if (!blob.checksum) return;

    if (blob.state === 'ATTACHED') {
      if (instantSyncAttach) {  
        setBlob(blob.checksum, { state: 'MARKED_FOR_DETACH' });
      } else {
        setBlob(blob.checksum, { state: 'DETACHED' });
      }
    }else{
      unlinkBlob();
    }

  };

  const handleRetry = () => {
    if (!blob.checksum || !blob.errorMessage) return;

    // Clear error and decrement retry count - user must click to retry
    const newRetryCount = blob.retryCount - 1;
    setBlob(blob.checksum, { 
      errorMessage: null,
      retryCount: newRetryCount,
    });
  };

  const unlinkBlob = () => {
    deleteFromFilesMap(blob.checksum!);
    removeBlobByHash(blob.checksum!);
    if (mainBlobHash === blob.checksum) {
      resetMainBlobHash();
    }
  };

  // Blob lifecycle state machine with local state control
  useEffect(() => {
    const handleStateTransition = async () => {
      if (!blob.checksum) return;
      
      const hash = blob.checksum;
      
      switch (blob.state) {
        case 'SELECTED_FOR_UPLOAD':
          // Only start upload if instantUpload is true, no error, and not already processing
          if (instantUpload && blob.name && blob.mimeType && blob.size && !blob.errorMessage) {
            setBlob(hash, { state: 'UPLOADING_URL_GENERATING' });
            
            const result = await mutations.getUploadUrl({
              hash,
              name: blob.name,
              mimeType: blob.mimeType,
              size: blob.size,
            });
            if (result.success) {
              if (result.uploadUrl) {
                setBlob(hash, {
                  uploadUrl: result.uploadUrl,
                  key: result.key,
                  errorMessage: null,
                  state: 'UPLOADING_URL_GENERATED',
                });
              } else if (result.blobId && result.key) {
                setBlob(hash, {
                  blobId: result.blobId,
                  key: result.key,
                  previewUrl: result.previewUrl ?? blob.previewUrl,
                  url: result.url ?? blob.url,
                  errorMessage: null,
                  state: 'BLOB_CREATED',
                });
              } else if (result.key) {
                setBlob(hash, {
                  key: result.key,
                  previewUrl: result.previewUrl ?? blob.previewUrl,
                  url: result.url ?? blob.url,
                  errorMessage: null,
                  state: 'UPLOADED',
                });
              }
            } else {
              // Step back to SELECTED_FOR_UPLOAD, set error and decrement retry count
              const newRetryCount = blob.retryCount - 1;
              setBlob(hash, {
                state: 'SELECTED_FOR_UPLOAD',
                errorMessage: result.error,
                retryCount: Math.max(newRetryCount, 0),
              });
            }
          }
          break;

        case 'UPLOADING_URL_GENERATED':
          // Only proceed if we have file, uploadUrl, and no error
          if (file && blob.uploadUrl && !blob.errorMessage) {
            setBlob(hash, { state: 'UPLOADING' });
            
            const result = await mutations.directUpload({
              hash,
              uploadUrl: blob.uploadUrl,
              file,
            });
            
            if (result.success) {
              setBlob(hash, {
                errorMessage: null,
                state: 'UPLOADED',
                key: blob.key,
              });
            } else {
              // Step back to UPLOADING_URL_GENERATED, set error and decrement retry count
              const newRetryCount = blob.retryCount - 1;
              setBlob(hash, {
                state: 'UPLOADING_URL_GENERATED',
                errorMessage: result.error,
                retryCount: Math.max(newRetryCount, 0),
              });
            }
          }
          break;

        case 'UPLOADED':
          // Only proceed if we have all required data and no error
          if (blob.key && blob.name && blob.mimeType && blob.size && !blob.errorMessage) {
            setBlob(hash, { state: 'BLOB_CREATING' });
            
            const result = await mutations.createBlob({
              hash,
              key: blob.key,
              name: blob.name,
              mimeType: blob.mimeType,
              size: blob.size,
            });
            
            if (result.success) {
              setBlob(hash, {
                blobId: result.id,
                key: result.key,
                previewUrl: result.previewUrl ?? result.url ?? null,
                url: result.url ?? null,
                errorMessage: null,
                state: 'BLOB_CREATED',
              });
            } else {
              // Step back to UPLOADED, set error and decrement retry count
              const newRetryCount = blob.retryCount - 1;
              setBlob(hash, {
                state: 'UPLOADED',
                errorMessage: result.error,
                retryCount: Math.max(newRetryCount, 0),
              });
            }
          }
          break;

        case 'BLOB_CREATED':
          // Only create attachment when instantSyncAttach is true, we have required data, and no error
          if (instantSyncAttach && attachableId && blob.blobId && !blob.errorMessage) {
            setBlob(hash, { state: 'ATTACHING' });
            
            const result = await mutations.createAttachment({
              hash,
              blobId: blob.blobId,
              attachableId,
              attachableType,
            });
            
            if (result.success) {
              setBlob(hash, {
                attachmentId: result.id,
                errorMessage: null,
                state: 'ATTACHED',
              });
            } else {
              // Step back to BLOB_CREATED, set error and decrement retry count
              const newRetryCount = blob.retryCount - 1;
              setBlob(hash, {
                state: 'BLOB_CREATED',
                errorMessage: result.error,
                retryCount: Math.max(newRetryCount, 0),
              });
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
          // Only proceed if instantSyncAttach is true, we have attachmentId, and no error
          if (instantSyncAttach && blob.attachmentId && !blob.errorMessage) {
            setBlob(hash, { state: 'DETACHING' });
            try {
              await mutations.deleteAttachment({
                hash,
                attachmentId: blob.attachmentId,
              });
              setBlob(hash, {
                errorMessage: null,
                state: 'DETACHED',
                attachmentId: null,
              });
            } catch (error) {
              // Stay at MARKED_FOR_DETACH, set error and decrement retry count
              const message =
                error instanceof Error ? error.message : 'Failed to detach blob';
              const newRetryCount = blob.retryCount - 1;
              setBlob(hash, {
                errorMessage: message,
                retryCount: Math.max(newRetryCount, 0),
                state: 'MARKED_FOR_DETACH',
              });
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
    instantUpload,
    instantSyncAttach,
    blob.state,
    blob.checksum,
    blob.errorMessage,
    setBlob,
    mutations,
  ]);

  // Don't render blobs that are being detached or detached
  if (
    (!instantUpload && blob.state === 'DETACHING') ||
    ['DETACHED', 'MARKED_FOR_DETACH'].includes(blob.state ?? '')
  ) {
    return null;
  }

  // Check if blob has an error (stays in same state with error)
  const hasError = !!blob.errorMessage;
  const canRetry = hasError && blob.retryCount > 0;

  return (
    <div 
      className={`${styling.blobContainerClassName} ${hasError ? styling.blobContainerFailedClassName : ''}`}
      title={blob.name ?? ''}
    >
      <img
        src={blob.previewUrl!}
        alt={`${blob.name}`}
        className={`${styling.blobImageClassName} ${hasError ? styling.blobImageFailedClassName : ''}`}
      />

      {/* Loading spinner - shows when blob is in progress (but not with error) */}
      {!hasError &&
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
          {canRetry && (
            <button
              type='button'
              onClick={handleRetry}
              disabled={processRunning}
              className={`${styling.retryButtonClassName} ${processRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={processRunning ? 'Form is processing' : 'Retry upload'}
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
        disabled={processRunning}
        className={`${styling.removeButtonClassName} ${processRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={processRunning ? 'Form is processing' : 'Remove blob'}
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
      {mainBlobHash !== blob.checksum && 
       (blob.state === 'ATTACHED' || blob.state === 'BLOB_CREATED') && (
        <button
          type='button'
          onClick={() => setMainBlobHash(blob.checksum!)}
          disabled={processRunning}
          className={`${styling.setMainButtonClassName} ${processRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={processRunning ? 'Form is processing' : 'Set as main blob'}
        >
          Set Main
        </button>
      )}
    </div>
  );
};

export default Blob;

