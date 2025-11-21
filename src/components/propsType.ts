import { MutationCallbacks } from '../types/mutations';
import { StylingProps } from '../types/styling';
import type { BlobType } from '../types/blob';

export type LoadedPropsType = {
  skeleton?: false;

  /**
   * Maximum number of blobs/files allowed
   * @default 10
   */
  maxBlobs?: number;

  /**
   * Entity ID to attach blobs to (e.g., Offer ID, Product ID)
   * Required for attachment creation
   */
  attachableId: number | null;

  /**
   * Entity type for attachments (e.g., 'Offer', 'Product')
   * @default 'Offer'
   */
  attachableType?: string;

  /**
   * Controls whether to start upload immediately when file is selected
   * - true: Start upload flow immediately (SELECTED_FOR_UPLOAD → UPLOADING_URL_GENERATING)
   * - false: File stays at SELECTED_FOR_UPLOAD until triggered
   * @default true
   */
  instantUpload?: boolean;

  /**
   * Controls whether to create attachments immediately after blob creation
   * - true: Create attachments immediately (BLOB_CREATED → ATTACHING)
   * - false: Stop at BLOB_CREATED state (attach later when offer is saved)
   * @default false
   */
  instantSyncAttach?: boolean;

  /**
   * Disable interactions when form is being submitted
   * @default false
   */
  processRunning?: boolean;

  /**
   * Maximum number of retry attempts for failed uploads
   * @default 3
   */
  maxRetries?: number;

  /**
   * Controlled list of blobs managed by the parent
   */
  blobs: BlobType[];

  /**
   * Setter provided by the parent to update the controlled blobs list
   */
  setBlobs: (next: BlobType[]) => void;

  /**
   * Main blob checksum (for marking featured image)
   */
  mainBlobHash?: string | null;

  /**
   * Callback when main blob changes
   */
  onMainBlobChange?: (checksum: string | null) => void;

  /**
   * API mutation callbacks
   * All callbacks should return Promises and throw on error
   */
  mutations: MutationCallbacks;

  /**
   * Custom Tailwind CSS classes for styling
   * Allows parent to override default styling
   */
  styling?: StylingProps;
};

type SkeletonPropsType = {
  skeleton: true;
};

type PropsType = SkeletonPropsType | LoadedPropsType;

export default PropsType;

