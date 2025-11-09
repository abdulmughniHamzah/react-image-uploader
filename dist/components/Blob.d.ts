import { BlobType } from '../types/blob';
import { StylingProps } from '../types/styling';
import { MutationCallbacks } from '../types/mutations';
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
declare const Blob: React.FC<BlobProps>;
export default Blob;
//# sourceMappingURL=Blob.d.ts.map