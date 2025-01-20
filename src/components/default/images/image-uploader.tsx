// @ts-nocheck

import ImageCropper from '@/components/default/images/image-cropper';
import useDialog from '@/hooks/use-dialog';
import { Button } from '@mui/material';
import { useState } from 'react';

interface ImageUploaderProps {
  originalFileName?: string;
  uploadFile: (file: File, path: string) => Promise<string>;
  max_size?: number;
  crop?: {
    uploadFile?: (file: File, path: string) => Promise<string>;
    path: string;
    props?: any;
  };
  thumbnail?: {
    uploadFile?: (file: File, path: string) => Promise<string>;
    path: string;
    dimensions: {
      width: number;
      height: number;
    };
  };
  multiple?: boolean;
}

const createThumbnail = async (file: File) => {
  const img = document.createElement('img');
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  return new Promise((resolve) => {
    img.onload = () => {
      const scaleSize = 100 / img.width;
      canvas.width = 100;
      canvas.height = img.height * scaleSize;
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(resolve, 'image/jpeg');
    };
    img.src = URL.createObjectURL(file);
  });
};

const resizeImage = (file: File, maxSize: number): Promise<File> => {
  return new Promise((resolve) => {
    const img = document.createElement('img');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      const scaleSize = maxSize / img.width;
      canvas.width = maxSize;
      canvas.height = img.height * scaleSize;
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], file.name, { type: 'image/jpeg' }));
        }
      }, 'image/jpeg');
    };
    img.src = URL.createObjectURL(file);
  });
};

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

const ImageUploader = ({
  originalFileName,
  uploadFile,
  max_size = MAX_FILE_SIZE,
  crop: cropObject,
  thumbnail,
  multiple = false,
}: ImageUploaderProps) => {
  const [imageSrc, setImageSrc] = useState<string>(null);
  const dialog = useDialog();

  const getFileName = (path: string): string => {
    return path.split('/').pop() || 'unknown-filename.jpg';
  };

  const processFile = async (file) => {
    if (file) {
      if (file.size > max_size) {
        console.log(
          `Resizing image to 1000px width. Current size: ${file.size}, max size: ${max_size}`
        );
        file = await resizeImage(file, 1000); // Resize to 1000px width
        console.log(`Resized image size: ${file.size}`);
      }

      // Save original image if originalFileName is provided
      if (originalFileName) {
        const originalFileUrl = await uploadFile(file, originalFileName);
        console.log('Original file uploaded:', originalFileUrl);
      }

      // If cropObject is set, open the dialog to crop the image
      if (cropObject?.path) {
        const url = URL.createObjectURL(file);
        setImageSrc(url);
        dialog.open();
      }

      if (thumbnail?.path) {
        const thumbnailBlob = await createThumbnail(file);
        const thumbnailFile = new File([thumbnailBlob], getFileName(thumbnail.path), {
          type: 'image/jpeg',
        });
        const uploadFunction = thumbnail.uploadFile || uploadFile;
        const thumbnailFileUrl = await uploadFunction(thumbnailFile, thumbnail.path);
        console.log('Thumbnail file uploaded:', thumbnailFileUrl);
      }
    }
  };

  const onFileChange = async (e: any) => {
    const files = multiple ? Array.from(e.target.files) : [e.target.files[0]];
    //let file = e.target.files[0];
    for (const file of files) {
      processFile(file);
    }
    // if (file) {
    //   if (file.size > max_size) {
    //     console.log(
    //       `Resizing image to 1000px width. Current size: ${file.size}, max size: ${max_size}`
    //     );
    //     file = await resizeImage(file, 1000); // Resize to 1000px width
    //     console.log(`Resized image size: ${file.size}`);
    //   }

    //   // Save original image if originalFileName is provided
    //   if (originalFileName) {
    //     const originalFileUrl = await uploadFile(file, originalFileName);
    //     console.log('Original file uploaded:', originalFileUrl);
    //   }

    //   // If cropObject is set, open the dialog to crop the image
    //   if (cropObject?.path) {
    //     const url = URL.createObjectURL(file);
    //     setImageSrc(url);
    //     dialog.open();
    //   }

    //   if (thumbnail?.path) {
    //     const thumbnailBlob = await createThumbnail(file);
    //     const thumbnailFile = new File([thumbnailBlob], getFileName(thumbnail.path), {
    //       type: 'image/jpeg',
    //     });
    //     const uploadFunction = thumbnail.uploadFile || uploadFile;
    //     const thumbnailFileUrl = await uploadFunction(thumbnailFile, thumbnail.path);
    //     console.log('Thumbnail file uploaded:', thumbnailFileUrl);
    //   }
    // }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={onFileChange}
        style={{ display: 'none' }}
        id="upload-button"
      />
      <label htmlFor="upload-button">
        <Button
          variant="contained"
          color="primary"
          component="span"
        >
          Upload Image
        </Button>
      </label>
      <ImageCropper
        imageUrl={imageSrc}
        filename={cropObject?.path}
        onSave={cropObject?.uploadFile || uploadFile}
        dialog={{ isOpen: !!imageSrc, close: () => setImageSrc(null) }}
        cropperProps={cropObject?.props}
      />
    </div>
  );
};

export default ImageUploader;
