// Main component - self-contained with internal state management
export { default } from './components/Uploader';

// Core types
export type { BlobType } from './types/blob';
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
