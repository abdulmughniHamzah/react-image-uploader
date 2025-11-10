/* components/RichTextEditor.tsx */
// 'use client';

import React from 'react';
import Uploader from './Uploader';
import Skeleton from './Skeleton';
import PropsType from './propsType';

const BlobUploader: React.FC<PropsType> = (props) => {
  if (props.skeleton) {
    return <Skeleton />;
  }

  return <Uploader {...props} />;
};

export default BlobUploader;
