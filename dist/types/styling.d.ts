export interface StylingProps {
    containerClassName?: string;
    uploadButtonClassName?: string;
    blobContainerClassName?: string;
    blobImageClassName?: string;
    blobContainerFailedClassName?: string;
    blobImageFailedClassName?: string;
    removeButtonClassName?: string;
    mainBlobBadgeClassName?: string;
    setMainButtonClassName?: string;
    loadingContainerClassName?: string;
    loadingSpinnerClassName?: string;
    errorContainerClassName?: string;
    errorMessageClassName?: string;
    retryButtonClassName?: string;
    removeButtonIconClassName?: string;
}
export declare const defaultStyling: Required<StylingProps>;
export declare function mergeStyling(custom?: StylingProps): Required<StylingProps>;
//# sourceMappingURL=styling.d.ts.map