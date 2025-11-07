/**
 * Styling customization types for react-blob-uploader
 * 
 * ALL components and buttons have default Tailwind CSS classes
 * that can be completely overridden by the consuming application.
 * 
 * This makes the component theme-agnostic and fully customizable.
 */

export interface StylingProps {
  /** Container wrapper classes */
  containerClassName?: string;
  
  /** Upload button classes */
  uploadButtonClassName?: string;
  
  /** Individual blob container classes */
  blobContainerClassName?: string;
  
  /** Blob image classes */
  blobImageClassName?: string;
  
  /** Blob container when in failed state */
  blobContainerFailedClassName?: string;
  
  /** Blob image when in failed state */
  blobImageFailedClassName?: string;
  
  /** Remove button classes */
  removeButtonClassName?: string;
  
  /** Main blob badge classes */
  mainBlobBadgeClassName?: string;
  
  /** Set as main button classes */
  setMainButtonClassName?: string;
  
  /** Loading spinner container classes */
  loadingContainerClassName?: string;
  
  /** Loading spinner icon classes */
  loadingSpinnerClassName?: string;
  
  /** Error container classes */
  errorContainerClassName?: string;
  
  /** Error message text classes */
  errorMessageClassName?: string;
  
  /** Retry button classes */
  retryButtonClassName?: string;
  
  /** Remove button icon classes */
  removeButtonIconClassName?: string;
}

/**
 * Default styling classes using ONLY Tailwind CSS
 * NO custom CSS variables - pure Tailwind for universal compatibility
 * 
 * These can be completely overridden by the consuming application
 * to match their theme (colors, sizing, spacing, etc.)
 */
export const defaultStyling: Required<StylingProps> = {
  // Container for all blobs and upload button
  containerClassName: `
    flex flex-wrap justify-start items-stretch
    gap-x-2 gap-y-4 lg:gap-x-4 lg:gap-y-6
    w-full
  `.replace(/\s+/g, ' ').trim(),
  
  // Upload button (add new files)
  uploadButtonClassName: `
    w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] md:w-[120px] md:h-[120px] lg:w-[140px] lg:h-[140px]
    flex items-center justify-center
    text-sm font-medium text-gray-600
    border-2 border-dashed border-gray-300
    rounded-lg
    bg-gray-50 hover:bg-gray-100
    hover:text-gray-800 hover:border-gray-400
    cursor-pointer
    transition-all duration-200
  `.replace(/\s+/g, ' ').trim(),
  
  // Individual blob container (normal state)
  blobContainerClassName: `
    relative
    w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] md:w-[120px] md:h-[120px] lg:w-[140px] lg:h-[140px]
    rounded-lg
    overflow-hidden
    bg-white
    border border-gray-200
    shadow-sm
  `.replace(/\s+/g, ' ').trim(),
  
  // Blob image (normal state)
  blobImageClassName: `
    w-full h-full object-cover
  `.replace(/\s+/g, ' ').trim(),
  
  // Blob container when in failed state
  blobContainerFailedClassName: `
    ring-2 ring-red-500
  `.replace(/\s+/g, ' ').trim(),
  
  // Blob image when in failed state
  blobImageFailedClassName: `
    opacity-50
  `.replace(/\s+/g, ' ').trim(),
  
  // Remove (X) button
  removeButtonClassName: `
    absolute top-1 right-1
    w-6 h-6
    flex items-center justify-center
    rounded-full
    bg-red-500 hover:bg-red-600
    text-white
    cursor-pointer
    transition-colors duration-200
    shadow-md
    z-10
  `.replace(/\s+/g, ' ').trim(),
  
  // Remove button icon
  removeButtonIconClassName: `
    w-4 h-4
  `.replace(/\s+/g, ' ').trim(),
  
  // Main blob badge
  mainBlobBadgeClassName: `
    absolute bottom-1 left-1
    px-2 py-0.5
    text-xs font-semibold
    bg-blue-600
    text-white
    rounded
    shadow-sm
    z-10
  `.replace(/\s+/g, ' ').trim(),
  
  // Set as main button
  setMainButtonClassName: `
    absolute bottom-1 left-1
    px-2 py-0.5
    text-xs font-medium
    bg-white bg-opacity-90 hover:bg-opacity-100
    text-gray-700 hover:text-gray-900
    rounded
    cursor-pointer
    transition-all duration-200
    shadow-sm
    z-10
  `.replace(/\s+/g, ' ').trim(),
  
  // Loading spinner container
  loadingContainerClassName: `
    absolute inset-0
    flex items-center justify-center
    bg-black bg-opacity-40
    backdrop-blur-sm
    z-20
  `.replace(/\s+/g, ' ').trim(),
  
  // Loading spinner icon
  loadingSpinnerClassName: `
    text-white animate-spin w-8 h-8
  `.replace(/\s+/g, ' ').trim(),
  
  // Error container
  errorContainerClassName: `
    absolute bottom-0 left-0 right-0
    px-2 py-2
    bg-red-600
    flex flex-col items-start gap-1
    z-10
  `.replace(/\s+/g, ' ').trim(),
  
  // Error message text
  errorMessageClassName: `
    text-xs text-white leading-tight
  `.replace(/\s+/g, ' ').trim(),
  
  // Retry button
  retryButtonClassName: `
    px-2 py-1
    text-xs font-medium
    bg-white text-red-600
    hover:bg-red-50
    rounded
    transition-colors duration-200
    cursor-pointer
  `.replace(/\s+/g, ' ').trim(),
};

/**
 * Merge custom styling with defaults
 */
export function mergeStyling(custom?: StylingProps): Required<StylingProps> {
  return {
    ...defaultStyling,
    ...custom,
  };
}

