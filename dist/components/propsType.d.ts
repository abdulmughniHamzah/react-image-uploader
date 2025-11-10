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
    initialBlobs?: BlobType[];
    onBlobsChange?: (blobs: BlobType[]) => void;
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