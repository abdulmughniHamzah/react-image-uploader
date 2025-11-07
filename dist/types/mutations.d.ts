export type GetUploadUrlResult = {
    success: true;
    hash: string;
    uploadUrl: string;
    key: string;
} | {
    success: false;
    hash: string;
    error: string;
};
export type DirectUploadResult = {
    success: true;
    hash: string;
} | {
    success: false;
    hash: string;
    error: string;
};
export type CreateBlobResult = {
    success: true;
    hash: string;
    id: number;
    key: string;
    url: string;
} | {
    success: false;
    hash: string;
    error: string;
};
export type CreateAttachmentResult = {
    success: true;
    hash: string;
    id: number;
} | {
    success: false;
    hash: string;
    error: string;
};
export type DeleteAttachmentResult = {
    success: true;
    hash: string;
} | {
    success: false;
    hash: string;
    error: string;
};
export type GetPreviewUrlResult = {
    success: true;
    hash: string;
    previewUrl: string;
} | {
    success: false;
    hash: string;
    error: string;
};
export interface MutationCallbacks {
    getUploadUrl: (params: {
        hash: string;
        name: string;
        mimeType: string;
        size: number;
    }) => Promise<GetUploadUrlResult>;
    directUpload: (params: {
        hash: string;
        uploadUrl: string;
        file: File;
    }) => Promise<DirectUploadResult>;
    createBlob: (params: {
        hash: string;
        key: string;
        name: string;
        mimeType: string;
        size: number;
    }) => Promise<CreateBlobResult>;
    createAttachment: (params: {
        hash: string;
        blobId: number;
        attachableId: number;
        attachableType: string;
    }) => Promise<CreateAttachmentResult>;
    deleteAttachment: (params: {
        hash: string;
        attachmentId: number;
    }) => Promise<DeleteAttachmentResult>;
    getPreviewUrl: (params: {
        hash: string;
        key: string;
    }) => Promise<GetPreviewUrlResult>;
}
export type PartialMutationCallbacks = Partial<MutationCallbacks>;
//# sourceMappingURL=mutations.d.ts.map