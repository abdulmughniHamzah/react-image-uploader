import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Blob, { BlobStateSetters } from './Blob';
import { BlobType } from '../types/blob';
import { StylingProps } from '../types/styling';
import { MutationCallbacks } from '../types/mutations';

interface SortableBlobProps {
  id: string;
  blob: BlobType;
  filesMap: Map<string, File>;
  instantUpload: boolean;
  instantSyncAttach: boolean;
  attachableId: number | null;
  attachableType: string;
  mainBlobHash: string | null;
  setMainBlobHash: (hash: string) => void;
  deleteFromFilesMap: (hash: string) => void;
  removeBlobByHash: (hash: string) => void;
  resetMainBlobHash: () => void;
  mutations: MutationCallbacks;
  stateSetters: BlobStateSetters;
  styling: Required<StylingProps>;
  processRunning: boolean;
}

function SortableBlob({
  id,
  blob,
  filesMap,
  instantUpload,
  instantSyncAttach,
  attachableId,
  attachableType,
  mainBlobHash,
  setMainBlobHash,
  deleteFromFilesMap,
  removeBlobByHash,
  resetMainBlobHash,
  mutations,
  stateSetters,
  styling,
  processRunning,
}: SortableBlobProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 999 : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <Blob
        instantUpload={instantUpload}
        instantSyncAttach={instantSyncAttach}
        attachableId={attachableId}
        attachableType={attachableType}
        file={filesMap.get(blob.checksum ?? '')}
        blob={blob}
        mainBlobHash={mainBlobHash ?? null}
        setMainBlobHash={setMainBlobHash}
        deleteFromFilesMap={deleteFromFilesMap}
        removeBlobByHash={removeBlobByHash}
        resetMainBlobHash={resetMainBlobHash}
        mutations={mutations}
        stateSetters={stateSetters}
        styling={styling}
        processRunning={processRunning}
      />
    </div>
  );
}

export default SortableBlob;

