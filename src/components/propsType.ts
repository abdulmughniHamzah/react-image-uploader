import { BlobType } from '../types/blob';
import { MutationCallbacks } from '../types/mutations';
import { StylingProps } from '../types/styling';

/**
 * Skeleton mode props (loading state)
 */
type SkeletonPropsType = {
  skeleton: true;
};

/**
 * Main component props (loaded state)
 * 
 * ARCHITECTURE: Self-contained component with internal state management
 * - Component manages photo states internally
 * - Parent provides mutation callbacks (API calls)
 * - Parent reads final state via onBlobsChange callback
 */
export type LoadedPropsType = {
  skeleton?: false;
  
  // ===== CORE CONFIGURATION =====
  /**
   * Maximum number of blobs/files allowed
   * @default 10
   */
  maxBlobs?: number;
  /** @deprecated Use maxBlobs instead */
  maxPhotos?: number;
  
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
  
  // ===== SYNC CONTROL =====
  /**
   * Controls attachment creation behavior:
   * - true: Create attachments immediately after blob creation
   * - false: Stop at BLOB_CREATED state (manual sync later)
   * 
   * Check sync completion: all blobs are either ATTACHED or (BLOB_CREATED && !syncBlobs)
   */
  syncBlobs?: boolean;
  /** @deprecated Use syncBlobs instead */
  syncPhotos?: boolean;
  
  /**
   * Legacy mode flag (for backward compatibility)
   * - true: Blobs sync immediately on upload
   * - false: Blobs sync only when syncBlobs is true
   * @default false
   */
  isImmediateSyncMode?: boolean;
  
  /**
   * Disable interactions when form is being submitted
   * @default false
   */
  processRunning?: boolean;
  
  // ===== STATE MANAGEMENT =====
  /**
   * Initial blobs state (for editing existing entities)
   * Component manages this internally after initialization
   */
  initialBlobs?: BlobType[];
  /** @deprecated Use initialBlobs instead */
  initialPhotos?: BlobType[];
  
  /**
   * Callback when blobs state changes
   * Parent reads final state through this callback
   */
  onBlobsChange?: (blobs: BlobType[]) => void;
  /** @deprecated Use onBlobsChange instead */
  onPhotosChange?: (photos: BlobType[]) => void;
  
  /**
   * Main blob checksum (for marking featured image)
   */
  mainBlobHash?: string | null;
  /** @deprecated Use mainBlobHash instead */
  mainPhotoHash?: string | null;
  
  /**
   * Callback when main blob changes
   */
  onMainBlobChange?: (checksum: string | null) => void;
  /** @deprecated Use onMainBlobChange instead */
  onMainPhotoChange?: (checksum: string | null) => void;
  
  // ===== MUTATION CALLBACKS =====
  /**
   * API mutation callbacks
   * All callbacks should return Promises and throw on error
   */
  mutations: MutationCallbacks;
  
  // ===== STYLING CUSTOMIZATION =====
  /**
   * Custom Tailwind CSS classes for styling
   * Allows parent to override default styling
   */
  styling?: StylingProps;
  
  // ===== LEGACY PROPS (Deprecated - for backward compatibility) =====
  /**
   * @deprecated Use initialBlobs instead
   */
  photos?: BlobType[];
  
  /**
   * @deprecated Managed internally now
   */
  addPhoto?: (photo: BlobType) => void;
  
  /**
   * @deprecated Managed internally now
   */
  removePhotoByHash?: (hash: string) => void;
  
  /**
   * @deprecated Managed internally now
   */
  removePhotoByKey?: (key: string) => void;
  
  /**
   * @deprecated Use onMainBlobChange instead
   */
  setMainBlobHash?: (hash: string) => void;
  
  /**
   * @deprecated Use onMainBlobChange instead
   */
  setMainPhotoHash?: (hash: string) => void;
  
  /**
   * @deprecated Use onMainBlobChange instead
   */
  resetMainPhotoHash?: () => void;
  
  /**
   * @deprecated Use mutations.getUploadUrl instead
   */
  getUploadUrl?: (hash: string) => void;
  
  /**
   * @deprecated Use mutations.getPreviewUrl instead
   */
  getPreviewUrl?: (hash: string) => void;
  
  /**
   * @deprecated Use mutations.directUpload instead
   */
  directUpload?: (hash: string, file: File) => void;
  
  /**
   * @deprecated Use mutations.createBlob instead
   */
  createBlob?: (hash: string) => void;
  
  /**
   * @deprecated Use mutations.createAttachment instead
   */
  createAttachment?: (hash: string, attachableId: number) => void;
  
  /**
   * @deprecated Use mutations.deleteAttachment instead
   */
  deleteAttachment?: (hash: string) => void;
  
  /**
   * @deprecated Managed internally now
   */
  resetMainBlobHash?: () => void;
  
  /**
   * @deprecated Managed internally now
   */
  setPhotoState?: (hash: string, state: BlobType['state']) => void;
  
  /**
   * @deprecated Managed internally now
   */
  setPhotos?: (photos: BlobType[]) => void;
};

type PropsType = SkeletonPropsType | LoadedPropsType;
export default PropsType;

