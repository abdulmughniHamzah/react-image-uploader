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
  const setBlob = stateSetters.setBlob;

  const handleRemoveBlob = () => {
    if (!blob.checksum) return;

    if (blob.state === 'ATTACHED' && instantUpload) {
      setBlob(blob.checksum, { state: 'MARKED_FOR_DETACH' });
      return;
    }

    setBlob(blob.checksum, { state: 'DETACHED' });
  };

  const handleRetry = () => {
    if (!blob.checksum) return;

    // Map failed states to their retry states
    switch (blob.state) {
      case 'UPLOADING_URL_GENERATION_FAILED':
        setBlob(blob.checksum, { state: 'SELECTED_FOR_UPLOAD' });
        break;
      case 'UPLOAD_FAILED':
        setBlob(blob.checksum, { state: 'UPLOADING_URL_GENERATED', errorMessage: null });
        break;
      case 'BLOB_CREATION_FAILED':
        setBlob(blob.checksum, { state: 'UPLOADED', errorMessage: null });
        break;
      case 'ATTACHMENT_FAILED':
        setBlob(blob.checksum, { state: 'BLOB_CREATED', errorMessage: null });
        break;
      case 'DETACHMENT_FAILED':
        setBlob(blob.checksum, { state: 'MARKED_FOR_DETACH', errorMessage: null });
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
  useEffect(() => {
    const handleStateTransition = async () => {
      if (!blob.checksum) return;
      
      const hash = blob.checksum;
      
      switch (blob.state) {
        case 'SELECTED_FOR_UPLOAD':
          // Only start upload if instantUpload is true
          if (instantUpload && blob.name && blob.mimeType && blob.size) {
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
              } else {
                setBlob(hash, {
                  previewUrl: result.previewUrl ?? blob.previewUrl,
                  url: result.url ?? blob.url,
                  errorMessage: null,
                  state: 'UPLOADED',
                });
              }
            } else {
              setBlob(hash, {
                errorMessage: result.error,
                state: 'UPLOADING_URL_GENERATION_FAILED',
              });
            }
          }
          break;

        case 'UPLOADING_URL_GENERATED':
          if (file && blob.uploadUrl) {
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
              });
            } else {
              setBlob(hash, {
                errorMessage: result.error,
                state: 'UPLOAD_FAILED',
              });
            }
          }
          break;

        case 'UPLOADED':
          if (blob.key && blob.name && blob.mimeType && blob.size) {
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
              setBlob(hash, {
                errorMessage: result.error,
                state: 'BLOB_CREATION_FAILED',
              });
            }
          }
          break;

        case 'BLOB_CREATED':
          // Only create attachment when instantSyncAttach is true and we have required data.
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
              setBlob(hash, {
                errorMessage: result.error,
                state: 'ATTACHMENT_FAILED',
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
          if (instantUpload && blob.attachmentId) {
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
              const message =
                error instanceof Error ? error.message : 'Failed to detach blob';
              setBlob(hash, {
                errorMessage: message,
                state: 'DETACHMENT_FAILED',
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

