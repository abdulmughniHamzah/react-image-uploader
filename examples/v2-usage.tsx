/**
 * Example usage snippets for the v2 API.
 * Each section demonstrates how to integrate the uploader with mock mutations.
 */

import React, { useState } from 'react';
import BlobUploader, {
  type BlobType,
  type MutationCallbacks,
  type StylingProps,
} from '../src';

const createMockMutations = (): MutationCallbacks => ({
  getUploadUrl: async ({ hash }) => ({
    success: true as const,
    hash,
    uploadUrl: null,
    key: `products/demo/${hash}`,
    blobId: null,
    previewUrl: null,
    url: null,
  }),
  directUpload: async ({ hash }) => ({
    success: true as const,
    hash,
  }),
  createBlob: async ({ hash, key }) => ({
    success: true as const,
    hash,
    id: 1,
    key,
    url: `https://example.com/${key}`,
    previewUrl: `https://example.com/${key}`,
  }),
  createAttachment: async ({ hash }) => ({
    success: true as const,
    hash,
    id: 1,
  }),
  deleteAttachment: async ({ hash }) => ({
    success: true as const,
    hash,
  }),
  getPreviewUrl: async ({ hash, key }) => ({
    success: true as const,
    hash,
    previewUrl: `https://example.com/${key}`,
  }),
});

export const BasicUsage = () => {
  const [blobs, setBlobs] = useState<BlobType[]>([]);
  const [mainBlobHash, setMainBlobHash] = useState<string | null>(null);
  const mutations = createMockMutations();

  const handleSubmit = () => {
    console.log('Submitting payload:', {
      blobs,
      mainBlobHash,
    });
  };

  return (
    <div>
      <BlobUploader
        initialBlobs={blobs}
        onBlobsChange={setBlobs}
        mainBlobHash={mainBlobHash}
        onMainBlobChange={setMainBlobHash}
        attachableId={123}
        attachableType="Offer"
        mutations={mutations}
        maxBlobs={10}
      />
      <button onClick={handleSubmit}>Save Changes</button>
    </div>
  );
};

export const CustomStyling = () => {
  const [blobs, setBlobs] = useState<BlobType[]>([]);
  const [mainBlobHash, setMainBlobHash] = useState<string | null>(null);
  const mutations = createMockMutations();

  const customStyling: StylingProps = {
    containerClassName: 'grid grid-cols-2 md:grid-cols-4 gap-4 p-4',
    uploadButtonClassName:
      'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-300 flex items-center justify-center cursor-pointer',
    blobContainerClassName:
      'rounded-xl overflow-hidden shadow-lg border-2 border-gray-200',
    removeButtonClassName: 'bg-red-500 hover:bg-red-600 shadow-lg',
    mainBlobBadgeClassName: 'bg-green-500 text-white font-bold',
  };

  return (
    <BlobUploader
      initialBlobs={blobs}
      onBlobsChange={setBlobs}
      mainBlobHash={mainBlobHash}
      onMainBlobChange={setMainBlobHash}
      attachableId={123}
      mutations={mutations}
      styling={customStyling}
    />
  );
};

export const EditMode = () => {
  const existingBlobs: BlobType[] = [
    {
      checksum: 'abc123',
      name: 'product-1.jpg',
      mimeType: 'image/jpeg',
      size: 524288,
      key: 'products/123/abc123.jpg',
      uploadUrl: null,
      previewUrl: 'https://example.com/preview/abc123',
      url: 'https://example.com/preview/abc123',
      blobId: 1,
      attachmentId: 10,
      state: 'ATTACHED',
      errorMessage: null,
    },
  ];

  const [blobs, setBlobs] = useState<BlobType[]>(existingBlobs);
  const [mainBlobHash, setMainBlobHash] = useState<string | null>('abc123');
  const mutations = createMockMutations();

  return (
    <BlobUploader
      initialBlobs={blobs}
      onBlobsChange={setBlobs}
      mainBlobHash={mainBlobHash}
      onMainBlobChange={setMainBlobHash}
      attachableId={123}
      mutations={mutations}
    />
  );
};

