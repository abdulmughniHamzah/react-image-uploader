import React from 'react';

/**
 * Skeleton loading state for BlobUploader
 */
const Skeleton: React.FC = () => {
  return (
    <div className="flex flex-wrap justify-start items-stretch gap-x-2 gap-y-4 lg:gap-x-4 lg:gap-y-6 rounded-lg">
      {[...Array(3)].map((_, index) => (
        <div
          key={index}
          className="
            w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] md:w-[120px] md:h-[120px] lg:w-[140px] lg:h-[140px]
            bg-gray-200 animate-pulse rounded-[4px]
          "
        />
      ))}
    </div>
  );
};

export default Skeleton;

