import { BlobStateSetters } from './Blob';
import { BlobType } from '../types/blob';
import { StylingProps } from '../types/styling';
import { MutationCallbacks } from '../types/mutations';
interface SortableBlobProps {
    id: string;
    blob: BlobType;
    filesMap: Map<string, File>;
    instantUpload: boolean;
    instantSyncAttach: boolean;
    attachableId: number | null;
    attachableType: string;
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
declare function SortableBlob({ id, blob, filesMap, instantUpload, instantSyncAttach, attachableId, attachableType, mainBlobHash, setMainBlobHash, deleteFromFilesMap, removeBlobByHash, resetMainBlobHash, mutations, stateSetters, styling, processRunning, }: SortableBlobProps): import("react/jsx-runtime").JSX.Element;
export default SortableBlob;
//# sourceMappingURL=SortableBlob.d.ts.map