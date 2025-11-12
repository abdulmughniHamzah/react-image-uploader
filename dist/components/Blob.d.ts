import { BlobType } from '../types/blob';
import { StylingProps } from '../types/styling';
import { MutationCallbacks } from '../types/mutations';
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
declare const Blob: React.FC<BlobProps>;
export default Blob;
//# sourceMappingURL=Blob.d.ts.map