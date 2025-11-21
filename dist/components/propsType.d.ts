import { MutationCallbacks } from '../types/mutations';
import { StylingProps } from '../types/styling';
import type { BlobType } from '../types/blob';
export type LoadedPropsType = {
    skeleton?: false;
    maxBlobs?: number;
    attachableId: number | null;
    attachableType?: string;
    instantUpload?: boolean;
    instantSyncAttach?: boolean;
    processRunning?: boolean;
    maxRetries?: number;
    blobs: BlobType[];
    setBlobs: (next: BlobType[]) => void;
    mainBlobHash?: string | null;
    onMainBlobChange?: (checksum: string | null) => void;
    mutations: MutationCallbacks;
    styling?: StylingProps;
};
type SkeletonPropsType = {
    skeleton: true;
};
type PropsType = SkeletonPropsType | LoadedPropsType;
export default PropsType;
//# sourceMappingURL=propsType.d.ts.map