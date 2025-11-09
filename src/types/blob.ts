/**
 * BlobType represents a file (image, document, video, etc.) in various stages of upload/attachment
 * This is the core type for the file uploader component
 */
export interface BlobType {
  errorMessage: string | null;
  key: string | null;
  name: string | null;
  uploadUrl: string | null;
  previewUrl: string | null;
  mimeType: string | null;
  size: number | null;
  url: string | null;
  checksum: string | null;
  attachmentId: number | null;
  blobId: number | null;
  state:
    | null
    | 'SELECTED_FOR_UPLOAD'
    | 'UPLOADING_URL_GENERATING'
    | 'UPLOADING_URL_GENERATED'
    | 'UPLOADING_URL_GENERATION_FAILED'  // New: User must retry
    | 'UPLOADING'
    | 'UPLOADED'
    | 'UPLOAD_FAILED'                     // New: User must retry
    | 'BLOB_CREATING'
    | 'BLOB_CREATED'
    | 'BLOB_CREATION_FAILED'              // New: User must retry
    | 'ATTACHING'
    | 'ATTACHED'
    | 'ATTACHMENT_FAILED'                 // New: User must retry
    | 'MARKED_FOR_DETACH'
    | 'DETACHING'
    | 'DETACHMENT_FAILED'                 // New: User must retry
    | 'DETACHED';
}

/**
 * @deprecated Use BlobType instead. PhotoType is kept for backward compatibility.
 */
export type PhotoType = BlobType;
