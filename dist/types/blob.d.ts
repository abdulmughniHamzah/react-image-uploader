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
    state: null | 'SELECTED_FOR_UPLOAD' | 'UPLOADING_URL_GENERATING' | 'UPLOADING_URL_GENERATED' | 'UPLOADING_URL_GENERATION_FAILED' | 'UPLOADING' | 'UPLOADED' | 'UPLOAD_FAILED' | 'BLOB_CREATING' | 'BLOB_CREATED' | 'BLOB_CREATION_FAILED' | 'ATTACHING' | 'ATTACHED' | 'ATTACHMENT_FAILED' | 'MARKED_FOR_DETACH' | 'DETACHING' | 'DETACHMENT_FAILED' | 'DETACHED';
}
export type PhotoType = BlobType;
//# sourceMappingURL=blob.d.ts.map