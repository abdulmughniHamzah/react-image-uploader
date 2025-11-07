// Main component - self-contained with internal state management
export { default as ImageUploader } from './components/Uploader';
export { default as BlobUploader } from './components/Uploader';
export { default } from './components/Uploader';

// Core types
export type { BlobType, PhotoType } from './types/blob'; // PhotoType is deprecated but kept for backward compatibility
export type { LoadedPropsType } from './components/propsType';
export type { BlobStateSetters } from './components/Blob';

// Mutation types - flat result structures
export type { 
  MutationCallbacks,
  GetUploadUrlResult,
  DirectUploadResult,
  CreateBlobResult,
  CreateAttachmentResult,
  DeleteAttachmentResult,
  GetPreviewUrlResult,
} from './types/mutations';

// Styling
export type { StylingProps } from './types/styling';

// Utils
export { calculateChecksum } from './utils/checksum';

// Deprecated exports for backward compatibility
/**
 * @deprecated Use BlobStateSetters instead
 */
export type { BlobStateSetters as PhotoStateSetters } from './components/Blob';
