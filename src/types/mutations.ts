/**
 * Mutation callback types for react-blob-uploader
 * 
 * These callbacks are provided by the parent application and perform the actual API calls.
 * The component handles all state transitions internally based on the results.
 * 
 * All mutations return FLAT result objects with hash included for complete isolation
 * from application data structures, making it truly framework-agnostic.
 */

/**
 * Flat result types - hash is always included at the root level
 * This makes the component completely isolated from the parent application's data structure
 */

export type GetUploadUrlResult =
  | { success: true; hash: string; uploadUrl: string | null; key: string, blobId: number | null,  previewUrl: string | null, url: string | null}
  | { success: false; hash: string; error: string };

export type DirectUploadResult =
  | { success: true; hash: string }
  | { success: false; hash: string; error: string };

export type CreateBlobResult =
  | { success: true; hash: string; id: number; key: string; url: string, previewUrl: string | null }
  | { success: false; hash: string; error: string };

export type CreateAttachmentResult =
  | { success: true; hash: string; id: number }
  | { success: false; hash: string; error: string };

export type DeleteAttachmentResult =
  | { success: true; hash: string }
  | { success: false; hash: string; error: string };

export type GetPreviewUrlResult =
  | { success: true; hash: string; previewUrl: string }
  | { success: false; hash: string; error: string };

/**
 * Mutation callbacks interface
 * All callbacks return flat results with hash included
 * No nested data structures - everything at root level
 */
export interface MutationCallbacks {
  /**
   * Get a signed upload URL for direct upload to S3
   * @returns Flat result with hash, uploadUrl, and key on success
   */
  getUploadUrl: (params: {
    hash: string;
    name: string;
    mimeType: string;
    size: number;
  }) => Promise<GetUploadUrlResult>;

  /**
   * Upload file directly to S3 using signed URL
   * @returns Flat result with hash on success
   */
  directUpload: (params: {
    hash: string;
    uploadUrl: string;
    file: File;
  }) => Promise<DirectUploadResult>;

  /**
   * Create blob record in database after successful upload
   * @returns Flat result with hash, id, key, url on success
   */
  createBlob: (params: {
    hash: string;
    key: string;
    name: string;
    mimeType: string;
    size: number;
  }) => Promise<CreateBlobResult>;

  /**
   * Create attachment linking blob to attachable entity
   * @returns Flat result with hash and attachment id on success
   */
  createAttachment: (params: {
    hash: string;
    blobId: number;
    attachableId: number;
    attachableType: string;
  }) => Promise<CreateAttachmentResult>;

  /**
   * Delete an attachment
   * @returns Flat result with hash on success
   */
  deleteAttachment: (params: {
    hash: string;
    attachmentId: number;
  }) => Promise<DeleteAttachmentResult>;

  /**
   * Get preview URL for displaying blob
   * @returns Flat result with hash and previewUrl on success
   */
  getPreviewUrl: (params: {
    hash: string;
    key: string;
  }) => Promise<GetPreviewUrlResult>;
}

/**
 * Optional partial mutations for cases where some operations are not needed
 */
export type PartialMutationCallbacks = Partial<MutationCallbacks>;

