export interface PhotoType {
  errorMessage: string | null;
  key: string | null;
  name: string | null;
  uploadUrl: string | null;
  previewUrl: string | null;
  mimeType: string | null;
  size: number | null;
  checksum: string | null;
  attachmentId: number | null;
  blobId: number | null;
  state:
    | null
    | 'SELECTED_FOR_UPLOAD'
    | 'UPLOADING_URL_GENERATING'
    | 'UPLOADING_URL_GENERATED'
    | 'UPLOADING'
    | 'UPLOADED'
    | 'BLOB_CREATING'
    | 'BLOB_CREATED'
    | 'ATTACHING'
    | 'ATTACHED'
    | 'MARKED_FOR_DETACH'
    | 'DETACHING'
    | 'DETACHED';
}
