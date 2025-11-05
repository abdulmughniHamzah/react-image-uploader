import { PhotoType } from '../types/photo';

type SkeletonPropsType = {
  skeleton: true;
};

export type LoadedPropsType = {
  skeleton?: false;
  isImmediateSyncMode: boolean;
  syncPhotos: boolean;
  deleteAttachment: (hash: string) => void;
  maxPhotos?: number;
  photos: PhotoType[];
  processRunning?: boolean;
  attachableId: number | null;
  mainPhotoHash: string | null;
  addPhoto: (photo: PhotoType) => void;
  removePhotoByHash: (hash: string) => void;
  removePhotoByKey: (key: string) => void;
  setMainPhotoHash: (hash: string) => void;
  getUploadUrl: (hash: string) => void;
  getPreviewUrl: (hash: string) => void;
  directUpload: (hash: string, file: File) => void;
  createBlob: (hash: string) => void;
  createAttachment: (hash: string, attachableId: number) => void;
  resetMainPhotoHash: () => void;
  setPhotoState: (hash: string, state: PhotoType['state']) => void;
  setPhotos: (photos: PhotoType[]) => void;
};

type PropsType = SkeletonPropsType | LoadedPropsType;
export default PropsType;
